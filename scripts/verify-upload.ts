// Run after `bun run build`. The model is a local HTTPS fixture, not GigaChat.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import * as XLSX from 'xlsx'
import { createLocalAiTestServer } from './local-ai-test-server'

const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
const mock = await createLocalAiTestServer(snapshot.payload)
const port = Number(process.env.UPLOAD_VERIFY_PORT || 3112)
const base = `http://127.0.0.1:${port}`
const child = Bun.spawn([process.env.NODE_BINARY || 'node', resolve('.output/server/index.mjs')], {
  cwd: process.cwd(), stdout: 'ignore', stderr: 'pipe', env: {
    ...process.env, HOST: '127.0.0.1', PORT: String(port),
    NUXT_GIGACHAT_AUTH_KEY: 'local-integration-test',
    NUXT_GIGACHAT_AUTH_URL: mock.url + '/oauth', NUXT_GIGACHAT_BASE_URL: mock.url,
    NUXT_GIGACHAT_CA_BUNDLE_FILE: mock.caPath, NUXT_GIGACHAT_VERIFY_SSL: 'true',
    NUXT_GIGACHAT_DEBUG: 'false',
  },
})
const upload = async (files: Array<{ name: string; data: Uint8Array }>, status = 200) => {
  const form = new FormData()
  files.forEach(file => form.append('files', new Blob([new Uint8Array(file.data)]), file.name))
  const response = await fetch(base + '/api/aideclarant/analyze', { method: 'POST', body: form })
  const body = await response.json()
  assert.equal(response.status, status, JSON.stringify(body).slice(0, 1000))
  return body
}
const post = async (route: string, data: unknown, status = 200) => {
  const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  assert.equal(response.status, status)
  return await response.json()
}
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(base + '/api/aideclarant/gigachat/health')).ok) { ready = true; break } } catch { /* wait for bind */ }
    await Bun.sleep(100)
  }
  assert.ok(ready, 'Upload preview must start')
  const files = await Promise.all(snapshot.payload.demoFiles.map(async (file: { name: string }) => ({ name: file.name, data: new Uint8Array(await Bun.file('public/aideclarant/demo/' + file.name).arrayBuffer()) })))
  const result = await upload(files)
  assert.equal(result.source, 'gigachat')
  assert.equal(result.aiConnection.connected, true)
  assert.equal(result.aiConnection.verifySsl, true)
  assert.deepEqual(result.errors, [])
  assert.equal(result.rows.length, 13)
  assert.deepEqual(result.documents, snapshot.payload.documents)
  assert.equal(result.declarationDraft.goodsCount, '3')
  assert.equal(result.declarationDraft['g22-sum'], '7470')
  assert.equal(result.declarationDraft['goods.2.g35-gross'], '490')
  assert.equal(mock.calls.filter(call => call.path === '/oauth').length, 1)
  assert.equal(mock.calls.filter(call => call.prompt?.includes('Текст документа:')).length, 4)
  assert.ok(mock.calls.filter(call => call.prompt?.includes('Текст документа:')).every(call => call.prompt!.split('Текст документа:')[1]!.trim().length > 100))

  // Exercise the real installed parsers, and confirm their extracted text reaches the client.
  const docx = new Uint8Array(await Bun.file('tests/fixtures/invoice-parser.docx').arrayBuffer())
  await upload([{ name: 'invoice.docx', data: docx }])
  assert.ok(mock.calls.some(call => call.prompt?.includes('INTEGRATION_DOCX_SENTINEL')))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['INTEGRATION_XLSX_SENTINEL', 'invoice test only']]), 'Invoice')
  await upload([{ name: 'invoice.xlsx', data: new Uint8Array(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })) }])
  assert.ok(mock.calls.some(call => call.prompt?.includes('INTEGRATION_XLSX_SENTINEL')))

  mock.calls.length = 0
  await upload([], 400)
  const unknown = await upload([{ name: 'unknown.bin', data: new TextEncoder().encode('test') }], 422)
  assert.match(unknown.message, /тип документа/)
  const oldDoc = await upload([{ name: 'invoice.doc', data: new TextEncoder().encode('test') }], 422)
  assert.match(oldDoc.message, /DOCX/)
  await upload([{ name: 'invoice.pdf', data: new TextEncoder().encode('invalid PDF') }], 422)
  assert.equal(mock.calls.length, 0, 'Unreadable documents must not start model or cross-check requests')
  const partial = await upload([files.find((file: { name: string }) => file.name.startsWith('invoice'))!, { name: 'unknown.bin', data: new TextEncoder().encode('test') }])
  assert.equal(partial.errors.length, 1)
  assert.deepEqual(Object.keys(partial.documents), ['invoice'])
  assert.equal(partial.rows.length, 13)
  assert.ok(partial.rows.every((row: { values: string[] }) => row.values[0] === '—'), 'AI must not fill an absent contract column from fixture values')

  mock.setMode('unavailable')
  const failed = await upload([files.find((file: { name: string }) => file.name.startsWith('invoice'))!], 422)
  assert.match(failed.message, /503/)
  const tnvedFailure = await post('/api/aideclarant/tnved', { goodsText: 'Local integration failure test' })
  assert.equal(tnvedFailure.source, 'local-fallback')
  assert.deepEqual(tnvedFailure.suggestions, [], 'Failure must not substitute unrelated demo codes')
  const crossFailure = await post('/api/aideclarant/crosscheck', { rows: snapshot.payload.rows })
  assert.equal(crossFailure.source, 'local-fallback')
  assert.equal(crossFailure.rows.length, 13)
  mock.setMode('invalid-json')
  const malformed = await upload([files.find((file: { name: string }) => file.name.startsWith('invoice'))!], 422)
  assert.match(malformed.message, /invalid JSON/)
  await post('/api/aideclarant/crosscheck', { rows: 'invalid' }, 400)
  await post('/api/aideclarant/export/pdf', {}, 400)
  await post('/api/aideclarant/tnved', { allowAi: false, goodsText: 'changed data' }, 400)
  mock.calls.length = 0
  const emptyTnved = await post('/api/aideclarant/tnved', {})
  assert.deepEqual(emptyTnved.suggestions, [])
  assert.equal(mock.calls.length, 0)
  process.stdout.write('PASS: actual PDF/DOCX/XLSX parsing, four-document upload, TLS/OAuth/chat, 13 rows, draft, partial files, empty/unknown/DOC/broken files, unavailable provider, invalid JSON, safe fallbacks and invalid requests. Model responses are local fixtures; no external AI calls.\n')
} finally {
  child.kill()
  await child.exited
  await mock.stop()
}
