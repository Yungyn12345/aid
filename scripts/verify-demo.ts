// Run after `bun run build`. All network requests stay on loopback.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { demoChecksum } from '../server/utils/aideclarant/demoSnapshot'

const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
let modelRequests = 0
const trap = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch() { modelRequests++; return Response.json({ error: 'Unexpected model request in fixed demo' }, { status: 500 }) } })
const port = Number(process.env.DEMO_VERIFY_PORT || 3110)
const base = `http://127.0.0.1:${port}`
const node = process.env.NODE_BINARY || 'node'
let child: ReturnType<typeof Bun.spawn> | null = null
const start = async () => {
  child = Bun.spawn([node, resolve('.output/server/index.mjs')], { cwd: process.cwd(), stdout: 'ignore', stderr: 'pipe', env: {
    ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'production',
    NUXT_GIGACHAT_AUTH_KEY: 'local-integration-test', NUXT_GIGACHAT_AUTH_URL: trap.url.toString(),
    NUXT_GIGACHAT_BASE_URL: trap.url.toString(), NUXT_GIGACHAT_DEBUG: 'false',
  } })
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(base + '/api/aideclarant/gigachat/health')).ok) return } catch { /* wait for bind */ }
    await Bun.sleep(100)
  }
  throw new Error('Production preview failed to start')
}
const stop = async () => { if (child) { child.kill(); await child.exited; child = null } }
const post = async (route: string, body: unknown) => {
  const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`)
  return response
}
const verify = (reply: any) => {
  assert.equal(reply.demoVersion, snapshot.version)
  assert.equal(reply.demoChecksum, snapshot.checksum)
  const { demoVersion, demoChecksum: checksum, ...payload } = reply
  assert.equal(demoChecksum(payload), checksum)
}
try {
  await start()
  const html = await fetch(base + '/AiDeclarant/')
  assert.equal(html.status, 200)
  assert.match(await html.text(), /ДЕКЛАРАЦИЯ ЗА ПАРУ МИНУТ/)
  const replies = await Promise.all(Array.from({ length: 24 }, async (_, index) => {
    const response = await post('/api/aideclarant/demo', { mode: ['ai', 'fixture', 'fixed'][index % 3], allowFixtureFallback: true })
    assert.equal(response.headers.get('x-demo-version'), snapshot.version)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    return await response.json()
  }))
  replies.forEach(verify)
  const first: any = replies[0]
  const edited = structuredClone(first)
  edited.rows.find((row: any) => row.id === 'amount.total').values[1] = '9999'
  const cross = await (await post('/api/aideclarant/crosscheck', { rows: edited.rows, demoVersion: first.demoVersion, allowAi: false })).json()
  assert.ok(cross.summary)
  const tnved = await (await post('/api/aideclarant/tnved', { documents: edited.documents, goodsText: 'changed local demo', demoVersion: first.demoVersion, allowAi: false })).json()
  assert.deepEqual(tnved, snapshot.payload.tnved)
  verify(await (await post('/api/aideclarant/demo', { mode: 'ai' })).json())
  const pdf = await post('/api/aideclarant/export/pdf', { declarationDraft: first.declarationDraft, filename: 'verified-demo' })
  const bytes = new Uint8Array(await pdf.arrayBuffer())
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
  await Bun.write('../audit/verified-demo.pdf', bytes)
  await stop()
  await start()
  verify(await (await post('/api/aideclarant/demo', { mode: 'ai' })).json())
  assert.equal(modelRequests, 0)
  process.stdout.write(`PASS: 24 parallel requests, legacy modes, local edits, cached TN VED, PDF, process restart; demo ${snapshot.version}; model requests: ${modelRequests}\n`)
} finally { await stop(); trap.stop(true) }
