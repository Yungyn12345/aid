// Run after `bun run build`. All network requests stay on loopback.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { demoChecksum } from '../server/utils/aideclarant/demoSnapshot'
import { createLocalAiTestServer } from './local-ai-test-server'
import { allDeclarationControls } from '../shared/aideclarant/schema'
import { createEmptyDraft, goodsKey } from '../shared/aideclarant/declaration'
import { buildDeclarationXml } from '../shared/aideclarant/xml'

const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
const trap = await createLocalAiTestServer(snapshot.payload)
const port = Number(process.env.DEMO_VERIFY_PORT || 3110)
const base = `http://127.0.0.1:${port}`
const node = process.env.NODE_BINARY || 'node'
let child: ReturnType<typeof Bun.spawn> | null = null
const start = async () => {
  child = Bun.spawn([node, resolve('.output/server/index.mjs')], { cwd: process.cwd(), stdout: 'ignore', stderr: 'pipe', env: {
    ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'production',
    NUXT_GIGACHAT_AUTH_KEY: 'local-integration-test', NUXT_GIGACHAT_AUTH_URL: trap.url + '/oauth',
    NUXT_GIGACHAT_BASE_URL: trap.url, NUXT_GIGACHAT_DEBUG: 'false',
    NUXT_GIGACHAT_CA_BUNDLE_FILE: trap.caPath, NUXT_GIGACHAT_VERIFY_SSL: 'true',
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
  assert.equal(reply.rows.length, 13)
  assert.equal(reply.demoChecksum, snapshot.checksum)
  const { demoVersion, demoChecksum: checksum, ...payload } = reply
  assert.equal(demoChecksum(payload), checksum)
}
try {
  await start()
  // Positive control: prove that this HTTPS counter detects actual AI-client calls.
  const control = await (await post('/api/aideclarant/tnved', { goodsText: 'Local integration calibration only' })).json()
  assert.equal(control.aiConnection.connected, true)
  assert.equal(trap.calls.length, 2, 'HTTPS mock must see OAuth and chat before testing the absence of calls')
  trap.calls.length = 0
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
  verify(await (await post('/api/aideclarant/demo', { mode: 'ai', force: true, refresh: true })).json())
  const staleVersion = await fetch(base + '/api/aideclarant/tnved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demoVersion: 'stale-version' }) })
  assert.equal(staleVersion.status, 409)
  const pdf = await post('/api/aideclarant/export/pdf', { declarationDraft: first.declarationDraft, filename: 'verified-demo' })
  const bytes = new Uint8Array(await pdf.arrayBuffer())
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
  await Bun.write('../audit/verified-demo.pdf', bytes)
  await Bun.write('../audit/verified-demo.xml', buildDeclarationXml(first.declarationDraft))
  const markerDraft = createEmptyDraft()
  const markers: string[] = []
  allDeclarationControls.forEach((control, index) => {
    if (control.type === 'checkbox') return
    const marker = `FINALFIELD${index}END`
    markerDraft[control.goods ? goodsKey(0, control.key) : control.key] = marker
    markers.push(marker)
  })
  markerDraft['g2-contragent'] = 'true'
  markerDraft['g8-contragent'] = 'true'
  const markerPdf = await post('/api/aideclarant/export/pdf', { declarationDraft: markerDraft, filename: 'all-print-fields' })
  await Bun.write('../audit/all-print-fields.pdf', await markerPdf.arrayBuffer())
  await Bun.write('../audit/all-print-markers.json', JSON.stringify(markers))
  // The offline replacement guards must leave the frozen file byte-for-byte intact.
  const beforeFreeze = await Bun.file('server/assets/aideclarant/demo/snapshot.json').text()
  for (const extra of [[], ['--replace']]) {
    const freeze = Bun.spawn([process.execPath, 'scripts/freeze-demo.ts', '--version', snapshot.version, ...extra], { stdout: 'ignore', stderr: 'pipe' })
    const message = await new Response(freeze.stderr).text()
    assert.notEqual(await freeze.exited, 0)
    assert.match(message, extra.length ? /new version/ : /already frozen/)
    assert.equal(await Bun.file('server/assets/aideclarant/demo/snapshot.json').text(), beforeFreeze)
  }
  await stop()
  await start()
  verify(await (await post('/api/aideclarant/demo', { mode: 'ai' })).json())
  assert.equal(trap.calls.length, 0)
  process.stdout.write(`PASS: calibrated HTTPS trap, 24 parallel requests, legacy/force modes, isolated edits, cached TN VED, stale version, PDF/XML, 102 print markers, freeze guards and process restart; demo ${snapshot.version}; model requests: ${trap.calls.length}\n`)
} finally { await stop(); await trap.stop() }
