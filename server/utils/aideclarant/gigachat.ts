import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { request as httpsRequest } from 'node:https'
import { resolve } from 'node:path'
import { URL } from 'node:url'
import { useRuntimeConfig } from '#imports'
import type { AiConnectionState } from './types'

let accessToken: string | null = null
let expiresAt = 0
let cachedCaKey = ''
let cachedCa: string | undefined

export class GigaChatError extends Error {
  meta: AiConnectionState

  constructor(message: string, meta: AiConnectionState) {
    super(message)
    this.name = 'GigaChatError'
    this.meta = meta
  }
}

type JsonHttpResponse = {
  status: number
  data: unknown
  raw: string
}

const nowIso = () => new Date().toISOString()

const causeToString = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const cause = (error as { cause?: unknown }).cause

  if (!cause) {
    return ''
  }

  if (cause instanceof Error) {
    return cause.message
  }

  return String(cause)
}

const parseModelList = (value?: string) => {
  if (!value) {
    return []
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

const buildModelChain = (primary: string, fallbacks?: string) => {
  const chain: string[] = []

  for (const model of [primary, ...parseModelList(fallbacks)]) {
    if (model && !chain.includes(model)) {
      chain.push(model)
    }
  }

  return chain
}

const extractJsonFromText = (text: string) => {
  const clean = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(clean)
  } catch {
    const first = clean.indexOf('{')
    const last = clean.lastIndexOf('}')

    if (first >= 0 && last > first) {
      return JSON.parse(clean.slice(first, last + 1))
    }

    throw new Error(`GigaChat returned invalid JSON: ${clean.slice(0, 500)}`)
  }
}

const runtimeString = (key: string, fallback = '') => {
  const config = useRuntimeConfig() as unknown as Record<string, unknown>
  const value = config[key]

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return fallback
}

const getRuntimeSettings = () => {
  const authUrl = runtimeString('gigachatAuthUrl', process.env.GIGACHAT_AUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth')
  const baseUrl = runtimeString('gigachatBaseUrl', process.env.GIGACHAT_BASE_URL || 'https://gigachat.devices.sberbank.ru/api/v1').replace(/\/+$/, '')
  const scope = runtimeString('gigachatScope', process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS')
  const verifySsl = runtimeString('gigachatVerifySsl', process.env.GIGACHAT_VERIFY_SSL || 'true') !== 'false'
  const caBundleFile = runtimeString('gigachatCaBundleFile', process.env.GIGACHAT_CA_BUNDLE_FILE || './certs/russian_trusted_root_ca_pem.crt')
  const debug = runtimeString('gigachatDebug', process.env.GIGACHAT_DEBUG || 'true') === 'true'

  return {
    authUrl,
    baseUrl,
    scope,
    verifySsl,
    caBundleFile,
    debug,
  }
}

const resolveCaPath = (caBundleFile: string) => {
  if (!caBundleFile) {
    return ''
  }

  return caBundleFile.startsWith('/') ? caBundleFile : resolve(process.cwd(), caBundleFile)
}

const readCaBundle = (meta: AiConnectionState) => {
  const settings = getRuntimeSettings()
  const caPath = resolveCaPath(settings.caBundleFile)

  meta.verifySsl = settings.verifySsl
  meta.caBundleFile = caPath || undefined
  meta.usedCaBundle = Boolean(settings.verifySsl && caPath && existsSync(caPath))

  if (!settings.verifySsl || !caPath || !existsSync(caPath)) {
    return undefined
  }

  if (cachedCa && cachedCaKey === caPath) {
    return cachedCa
  }

  cachedCa = readFileSync(caPath, 'utf8')
  cachedCaKey = caPath

  return cachedCa
}

const createMeta = (): AiConnectionState => {
  const settings = getRuntimeSettings()
  const caPath = resolveCaPath(settings.caBundleFile)

  return {
    provider: 'gigachat',
    connected: false,
    usedFallback: false,
    checkedAt: nowIso(),
    durationMs: 0,
    stage: 'not-started',
    modelsTried: [],
    authUrl: settings.authUrl,
    baseUrl: settings.baseUrl,
    usedCaBundle: Boolean(settings.verifySsl && caPath && existsSync(caPath)),
    caBundleFile: caPath || undefined,
    verifySsl: settings.verifySsl,
  }
}

const finishMeta = (meta: AiConnectionState, startedAt: number, patch: Partial<AiConnectionState> = {}) => {
  Object.assign(meta, patch)
  meta.durationMs = Date.now() - startedAt
  meta.checkedAt = nowIso()

  return meta
}

const requestJson = (url: string, options: {
  method: 'POST'
  headers: Record<string, string>
  body: string
}, meta: AiConnectionState): Promise<JsonHttpResponse> => {
  const parsed = new URL(url)
  const ca = readCaBundle(meta)
  const settings = getRuntimeSettings()

  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpsRequest({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: `${parsed.pathname}${parsed.search}`,
      method: options.method,
      headers: {
        ...options.headers,
        'Content-Length': Buffer.byteLength(options.body),
      },
      ca,
      rejectUnauthorized: settings.verifySsl,
    }, (response) => {
      const chunks: Buffer[] = []

      response.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })

      response.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        let data: unknown = null

        try {
          data = raw ? JSON.parse(raw) : null
        } catch {
          data = null
        }

        resolveRequest({
          status: response.statusCode || 0,
          data,
          raw,
        })
      })
    })

    request.setTimeout(45_000, () => {
      request.destroy(new Error('GigaChat request timeout'))
    })

    request.on('error', rejectRequest)
    request.write(options.body)
    request.end()
  })
}

const requireAuthKey = () => {
  const config = useRuntimeConfig() as unknown as Record<string, unknown>
  const rawKey = String(config.gigachatAuthKey || process.env.GIGACHAT_AUTH_KEY || '').trim()

  if (!rawKey) {
    throw new Error('GIGACHAT_AUTH_KEY is not set')
  }

  return rawKey.toLowerCase().startsWith('basic ') ? rawKey : `Basic ${rawKey}`
}

const getAccessToken = async (meta: AiConnectionState) => {
  const now = Date.now()

  if (accessToken && expiresAt > now + 30_000) {
    meta.stage = 'oauth'
    return accessToken
  }

  const settings = getRuntimeSettings()
  const requestId = randomUUID()
  meta.stage = 'oauth'
  meta.requestId = requestId

  if (settings.debug) {
    console.log('[GIGACHAT] OAuth request started', {
      url: settings.authUrl,
      requestId,
      usedCaBundle: meta.usedCaBundle,
      caBundleFile: meta.caBundleFile,
      verifySsl: meta.verifySsl,
    })
  }

  const response = await requestJson(settings.authUrl, {
    method: 'POST',
    headers: {
      Authorization: requireAuthKey(),
      RqUID: requestId,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ scope: settings.scope }).toString(),
  }, meta)

  meta.httpStatus = response.status

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`GigaChat OAuth failed: ${response.status} ${JSON.stringify(response.data || response.raw).slice(0, 500)}`)
  }

  const token = (response.data as { access_token?: string; expires_at?: number } | null)?.access_token

  if (!token) {
    throw new Error(`GigaChat OAuth did not return access_token: ${JSON.stringify(response.data || response.raw).slice(0, 500)}`)
  }

  accessToken = token
  expiresAt = typeof (response.data as { expires_at?: unknown } | null)?.expires_at === 'number'
    ? (response.data as { expires_at: number }).expires_at
    : Date.now() + 25 * 60 * 1000

  if (settings.debug) {
    console.log('[GIGACHAT] OAuth request finished', {
      status: response.status,
      expiresAt,
    })
  }

  return accessToken
}

export const getGigaChatErrorMeta = (error: unknown): AiConnectionState => {
  if (error instanceof GigaChatError) {
    return error.meta
  }

  const meta = createMeta()
  meta.usedFallback = true
  meta.error = error instanceof Error ? error.message : String(error)
  meta.cause = causeToString(error)

  return meta
}

export const callGigaChatJsonControlled = async <T>(params: {
  system?: string
  prompt: string
  modelType?: 'docs' | 'tnved'
}): Promise<{ data: T; meta: AiConnectionState }> => {
  const startedAt = Date.now()
  const meta = createMeta()
  let lastError: unknown = null

  try {
    const config = useRuntimeConfig() as unknown as Record<string, unknown>
    const settings = getRuntimeSettings()
    const primary = params.modelType === 'tnved'
      ? String(config.gigachatModelTnved || process.env.GIGACHAT_MODEL_TNVED || 'GigaChat-2')
      : String(config.gigachatModelDocs || process.env.GIGACHAT_MODEL_DOCS || 'GigaChat-2')
    const fallbacks = params.modelType === 'tnved'
      ? String(config.gigachatModelTnvedFallbacks || process.env.GIGACHAT_MODEL_TNVED_FALLBACKS || 'GigaChat-Pro,GigaChat-Max')
      : String(config.gigachatModelDocsFallbacks || process.env.GIGACHAT_MODEL_DOCS_FALLBACKS || 'GigaChat-Pro,GigaChat-Max')

    const modelChain = buildModelChain(primary, fallbacks)
    meta.modelsTried = []

    const token = await getAccessToken(meta)

    for (const model of modelChain) {
      try {
        meta.stage = 'chat'
        meta.model = model
        meta.modelsTried = [...(meta.modelsTried || []), model]

        if (settings.debug) {
          console.log('[GIGACHAT] Chat request started', {
            model,
            url: `${settings.baseUrl}/chat/completions`,
          })
        }

        const response = await requestJson(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0,
            stream: false,
            messages: [
              ...(params.system ? [{ role: 'system', content: params.system }] : []),
              { role: 'user', content: params.prompt },
            ],
          }),
        }, meta)

        meta.httpStatus = response.status

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`GigaChat ${model} failed: ${response.status} ${JSON.stringify(response.data || response.raw).slice(0, 500)}`)
        }

        const content = (response.data as { choices?: Array<{ message?: { content?: unknown } }> } | null)?.choices?.[0]?.message?.content

        if (!content || typeof content !== 'string') {
          throw new Error(`GigaChat ${model} did not return text content`)
        }

        try {
          const parsed = extractJsonFromText(content) as T
          finishMeta(meta, startedAt, {
            connected: true,
            usedFallback: false,
            stage: 'done',
            model,
            error: undefined,
            cause: undefined,
          })

          if (settings.debug) {
            console.log('[GIGACHAT] Chat request finished', {
              model,
              status: response.status,
              durationMs: meta.durationMs,
            })
          }

          return { data: parsed, meta }
        } catch (parseError) {
          meta.stage = 'parse'
          throw parseError
        }
      } catch (error) {
        lastError = error
        meta.error = error instanceof Error ? error.message : String(error)
        meta.cause = causeToString(error)
      }
    }

    throw lastError instanceof Error ? lastError : new Error('GigaChat request failed')
  } catch (error) {
    finishMeta(meta, startedAt, {
      connected: false,
      usedFallback: true,
      error: error instanceof Error ? error.message : String(error),
      cause: causeToString(error),
    })

    throw new GigaChatError(meta.error || 'GigaChat request failed', meta)
  }
}

export const callGigaChatJson = async <T>(params: {
  system?: string
  prompt: string
  modelType?: 'docs' | 'tnved'
}): Promise<T> => {
  const result = await callGigaChatJsonControlled<T>(params)
  return result.data
}

export const diagnoseGigaChatConnection = async (): Promise<AiConnectionState> => {
  try {
    const { meta } = await callGigaChatJsonControlled<{ ok: boolean }>({
      system: 'Ты проверяешь доступность GigaChat. Верни только JSON.',
      prompt: 'Верни строго JSON: {"ok": true}',
      modelType: 'docs',
    })

    return meta
  } catch (error) {
    return getGigaChatErrorMeta(error)
  }
}
