import { readFile, writeFile, access, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildComparisonRowsFromDocuments, localCrossCheckRows } from '../shared/aideclarant/comparison'
import { buildDeclarationDraftFromDocuments } from '../shared/aideclarant/declaration'
import { demoChecksum, type DemoSnapshot, type FixedDemoPayload } from '../server/utils/aideclarant/demoSnapshot'
import type { ExtractedDocuments, TnvedSuggestionResult } from '../shared/aideclarant/types'

const option = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1] }
const version = option('--version')
if (!version || !/^[\w.-]+$/.test(version)) throw new Error('Specify an explicit --version before freezing a new demo.')
const destination = resolve('server/assets/aideclarant/demo/snapshot.json')
const exists = await access(destination).then(() => true, () => false)
if (exists && !process.argv.includes('--replace')) throw new Error('The demo is already frozen. Replacement requires the explicit --replace flag and a new version.')
if (exists) { const old = JSON.parse(await readFile(destination, 'utf8')); if (old.version === version) throw new Error('Use a new version when replacing a frozen demo.') }
const input = option('--input')
const raw = input ? JSON.parse(await readFile(resolve(input), 'utf8')) : null
const documents: ExtractedDocuments = raw?.documents || {}
if (!input) for (const [type, name] of [['agreement', 'agreement'], ['invoice', 'invoice'], ['packingList', 'pl'], ['cmr', 'cmr']] as const) documents[type] = JSON.parse(await readFile(resolve(`server/assets/aideclarant/demo/${name}.json`), 'utf8'))
if (!['agreement', 'invoice', 'packingList', 'cmr'].every(type => documents[type as keyof ExtractedDocuments])) throw new Error('All four extracted documents are required; do not freeze a partial generation.')
const suggestionFile = option('--tnved-input')
const candidate: TnvedSuggestionResult = suggestionFile ? JSON.parse(await readFile(resolve(suggestionFile), 'utf8')) : { source: 'demo-cache', summary: 'В этой версии демо рекомендации по ТН ВЭД не сохранялись.', suggestions: [] }
const tnved: TnvedSuggestionResult = { source: 'demo-cache', summary: candidate.summary, suggestions: candidate.suggestions }
const demoFiles = await Promise.all(['ved-dogovor_TI-GM-2025-012.pdf', 'invoice_GM-INV-2025-384.pdf', 'packing_list_PL-2025-384.pdf', 'CMR.pdf'].map(async name => ({ name, extension: 'PDF', size: (await stat(resolve('public/aideclarant/demo', name))).size })))
const crossCheck = localCrossCheckRows(buildComparisonRowsFromDocuments(documents))
const payload: FixedDemoPayload = { documents, declarationDraft: buildDeclarationDraftFromDocuments(documents), ...crossCheck, source: 'demo-cache', errors: [], demoMode: 'fixed', tnved, demoFiles }
const snapshot: DemoSnapshot = { version, frozenAt: new Date().toISOString(), provenance: raw?.review || (input ? 'One-time extraction supplied to the offline freeze command' : 'Existing extracted document fixtures; no model request'), checksum: demoChecksum(payload), payload }
await writeFile(destination, JSON.stringify(snapshot, null, 2) + '\n')
process.stdout.write(`Frozen demo ${version}: ${snapshot.checksum}\n`)
