import { expect, test } from 'bun:test'
import { applyComparisonEdit, buildComparisonRowsFromDocuments, excelComparisonAttributes, localCrossCheckRows } from '../shared/aideclarant/comparison'
import { applyComparisonValueToDraft, buildDeclarationDraftFromDocuments, draftValue } from '../shared/aideclarant/declaration'

test('the public comparison contains exactly the 13 worksheet attributes, in worksheet order', async () => {
  const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
  const rows = buildComparisonRowsFromDocuments(snapshot.payload.documents)
  expect(rows.map(row => row.attribute)).toEqual([...excelComparisonAttributes])
  expect(rows).toHaveLength(13)
  expect(snapshot.payload.rows.map((row: any) => row.attribute)).toEqual([...excelComparisonAttributes])
  expect(rows.some(row => row.id?.startsWith('internal.'))).toBeFalse()
  expect(localCrossCheckRows(rows).summary).toStartWith('Проверено строк: 13.')
  expect(rows.find(row => row.id === 'goods.description')?.values[1]?.split('\n')).toHaveLength(3)
  expect(rows.find(row => row.id === 'goods.description')?.values[2]?.split('\n')).toHaveLength(3)
})
test('a compound party edit preserves full address and reaches the declaration', () => {
  const documents = { invoice: { buyer: { name: 'Buyer', address: 'Street / building 1', inn: '123' } } }
  const row = buildComparisonRowsFromDocuments(documents).find(row => row.id === 'receiver')!
  const changed = applyComparisonEdit(documents, row, 1, 'Edited buyer\nCountry, Street / building 2')
  expect(changed.invoice?.buyer).toEqual({ name: 'Edited buyer', address: 'Country, Street / building 2', legal_address: 'Country, Street / building 2', inn: '123' })
  const draft = applyComparisonValueToDraft(buildDeclarationDraftFromDocuments(changed), row, 'Edited buyer\nCountry, Street / building 2')
  expect(draft['g8-name']).toBe('Edited buyer')
  expect(draft['g8-addr']).toBe('Country, Street / building 2')
})
test('Incoterms and reference dates stay inside their worksheet rows and remain editable', () => {
  const documents = { invoice: { incoterms: { rule: 'CIF', place: 'Shanghai', version: '2020' }, contract_reference: { number: 'A-1', date: '2026-01-01' } } }
  const terms = buildComparisonRowsFromDocuments(documents).find(row => row.id === 'incoterms')!
  const changed = applyComparisonEdit(documents, terms, 1, 'CIF Vladivostok (Incoterms 2020)')
  const draft = applyComparisonValueToDraft(buildDeclarationDraftFromDocuments(changed), terms, 'CIF Vladivostok (Incoterms 2020)')
  expect(draft['g20-code']).toBe('CIF')
  expect(draft['g20-place']).toBe('Vladivostok')
  const reference = buildComparisonRowsFromDocuments(changed).find(row => row.id === 'contract.number')!
  const edited = applyComparisonEdit(changed, reference, 1, 'B-2 от 2026-02-03')
  expect(edited.invoice?.contract_reference).toEqual({ number: 'B-2', date: '2026-02-03' })
})
test('all goods remain editable in one description row without changing amounts or losing split places', () => {
  const documents = { invoice: { items: [{ model_or_sku: 'AB-1', description: 'Bolt AB-1', quantity: 2 }, { model_or_sku: 'CD-2', description: 'Nut CD-2', quantity: 3 }] }, packingList: { items: [{ model_or_sku: 'AB-1', description: 'Bolt', quantity: 1 }, { model_or_sku: 'AB-1', description: 'Bolt', quantity: 1 }, { model_or_sku: 'CD-2', description: 'Nut', quantity: 3 }] } }
  const row = buildComparisonRowsFromDocuments(documents).find(row => row.id === 'goods.description')!
  const changed = applyComparisonEdit(documents, row, 2, 'Edited bolt\nEdited nut')
  expect((changed.packingList?.items as any[]).map(item => item.description)).toEqual(['Edited bolt', 'Edited bolt', 'Edited nut'])
  expect((changed.packingList?.items as any[]).map(item => item.quantity)).toEqual([1, 1, 3])
  const updated = buildComparisonRowsFromDocuments(changed).find(row => row.id === 'goods.description')!
  updated.preferredColumn = 2
  const draft = applyComparisonValueToDraft(buildDeclarationDraftFromDocuments(changed), updated, updated.values[2]!)
  expect(draftValue(draft, 'g31-desc', 0)).toContain('Edited bolt')
  expect(draftValue(draft, 'g31-desc', 1)).toContain('Edited nut')
  expect(() => applyComparisonEdit(documents, row, 2, 'Merged ambiguously')).toThrow()
})
