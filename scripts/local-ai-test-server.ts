// Local integration fixture, never imported by the application.
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { documentLabels, type ExtractedDocuments } from '../shared/aideclarant/types'

export const createLocalAiTestServer = async (payload: {
  documents: ExtractedDocuments
  rows: unknown[]
  tnved: unknown
}) => {
  const directory = await mkdtemp(join(tmpdir(), 'aidoc-ai-test-'))
  const caPath = join(directory, 'certificate.pem')
  const keyPath = join(directory, 'key.pem')
  const configPath = join(directory, 'openssl.cnf')
  await writeFile(configPath, `[req]
distinguished_name=dn
x509_extensions=extensions
prompt=no
[dn]
CN=localhost
[extensions]
subjectAltName=DNS:localhost,IP:127.0.0.1
basicConstraints=critical,CA:true
keyUsage=critical,digitalSignature,keyEncipherment,keyCertSign
`)
  try {
    await promisify(execFile)('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-config', configPath, '-keyout', keyPath, '-out', caPath], { timeout: 15000 })
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
  const calls: Array<{ path: string; prompt?: string }> = []
  let mode: 'ok' | 'unavailable' | 'invalid-json' = 'ok'
  const server = Bun.serve({
    hostname: '127.0.0.1', port: 0,
    tls: { cert: await readFile(caPath), key: await readFile(keyPath) },
    async fetch(request) {
      const path = new URL(request.url).pathname
      if (path === '/oauth') {
        calls.push({ path })
        return Response.json({ access_token: 'local-integration-token', expires_at: Date.now() + 600000 })
      }
      const body = await request.json() as { messages?: Array<{ role: string; content: string }> }
      const prompt = body.messages?.find(message => message.role === 'user')?.content || ''
      calls.push({ path, prompt })
      if (mode === 'unavailable') return Response.json({ error: 'Injected integration failure' }, { status: 503 })
      let data: unknown
      const extraction = Object.entries(documentLabels).find(([, label]) => prompt.includes(`Документ: ${label}.`))
      if (extraction) data = payload.documents[extraction[0] as keyof ExtractedDocuments]
      else if (prompt.includes('ИИ-кросс-проверку')) data = { rows: payload.rows }
      else data = payload.tnved
      return Response.json({ choices: [{ message: { content: mode === 'invalid-json' ? 'Invalid JSON response' : JSON.stringify(data) } }] })
    },
  })
  return {
    url: server.url.toString().replace(/\/$/, ''), caPath, calls,
    setMode(value: typeof mode) { mode = value },
    async stop() { server.stop(true); await rm(directory, { recursive: true, force: true }) },
  }
}
