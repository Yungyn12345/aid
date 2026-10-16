import { describe, expect, test } from 'bun:test'
import { allDeclarationControls } from '../shared/aideclarant/schema'
import { applyComparisonValueToDraft, buildDeclarationDraftFromDocuments, calculatePayments, calculateValuation, createEmptyDraft, draftValue, goodsKey, mergeGeneratedDraft, removeGoodsAt, resizeGoods, updateDraftValue } from '../shared/aideclarant/declaration'
import { buildTypstDeclarationData } from '../server/utils/aideclarant/typstDeclaration'
import { applyCrossCheckResult, buildDetailedComparisonRowsFromDocuments as buildComparisonRowsFromDocuments, evaluateComparisonRow } from '../shared/aideclarant/comparison'
import { demoChecksum, validateDemoSnapshot } from '../server/utils/aideclarant/demoSnapshot'
import type { ComparisonRow } from '../shared/aideclarant/types'

const row = (attribute: string, values: string[], kind?: ComparisonRow['kind']): ComparisonRow => ({ attribute, values, kind, applicable: values.map(value => value !== '—') })
describe('prototype and print parity', () => {
  test('every supplied control has a distinct stable key', () => {
    expect(allDeclarationControls).toHaveLength(106)
    expect(new Set(allDeclarationControls.map(control => control.key)).size).toBe(106)
    expect(allDeclarationControls.filter(control => control.type === 'checkbox')).toHaveLength(4)
    for (const key of ['g2-name', 'g8-name', 'g14-name', 'g19-cont', 'g37-procedure', 'g54-authority-to']) expect(allDeclarationControls.some(control => control.key === key)).toBeTrue()
  })
  test('all text controls reach print data; no rules, source map or editor controls', () => {
    const draft = createEmptyDraft()
    const markers: string[] = []
    allDeclarationControls.forEach((control, index) => {
      if (control.type === 'checkbox') return
      const value = `PRINTFIELD${index}END`; markers.push(value)
      draft[control.goods ? goodsKey(0, control.key) : control.key] = value
    })
    const printable = JSON.stringify(buildTypstDeclarationData(draft))
    markers.forEach(marker => expect(printable).toContain(marker))
    expect(printable).not.toContain('Карта источников')
    expect(printable).not.toContain('Правило заполнения')
    expect(printable).not.toContain('alta.ru')
  })
  test('checkbox choices are printed and graph 14 suppresses unused party details', () => {
    let draft = createEmptyDraft()
    draft['g2-name'] = 'DO NOT PRINT THIS PARTY'
    draft = updateDraftValue(draft, 'g2-same', 'true')
    draft = updateDraftValue(draft, 'g8-contragent', 'true')
    const printable = buildTypstDeclarationData(draft)
    expect(printable.sections.flatMap(section => section.checkboxes).filter(option => option.checked)).toHaveLength(2)
    expect(JSON.stringify(printable)).not.toContain('DO NOT PRINT THIS PARTY')
    expect(draft['g2-name']).toBe('DO NOT PRINT THIS PARTY')
    expect(updateDraftValue(draft, 'g2-same', 'false')['g2-name']).toBe('DO NOT PRINT THIS PARTY')
  })
  test('goods remain separate and renumber correctly after deletion', () => {
    let draft = resizeGoods(createEmptyDraft(), 4)
    draft = updateDraftValue(draft, 'g31-desc', 'third item', 2)
    expect(draft['g3-total']).toBe('2')
    draft = removeGoodsAt(draft, 0)
    expect(draft.goodsCount).toBe('3')
    expect(draftValue(draft, 'g31-desc', 1)).toBe('third item')
    expect(draftValue(draft, 'g32-num', 1)).toBe('2')
  })
  test('rebuilding source data preserves manual edits', () => {
    const original = buildDeclarationDraftFromDocuments({ invoice: { seller: { name: 'A' }, items: [{ quantity: 1 }] } })
    const edited = updateDraftValue(original, 'g2-name', 'manual name')
    const next = buildDeclarationDraftFromDocuments({ invoice: { seller: { name: 'B' }, items: [{ quantity: 2 }] } })
    const merged = mergeGeneratedDraft(edited, original, next)
    expect(merged['g2-name']).toBe('manual name')
    expect(draftValue(merged, 'g41-quantity')).toBe('2')
    expect(applyComparisonValueToDraft(merged, { attribute: 'name', values: [], draftKeys: ['g2-name'] }, 'chosen')['g2-name']).toBe('chosen')
  })
  test('unknown customs costs and rates are never copied from invoice totals', () => {
    const draft = buildDeclarationDraftFromDocuments({ invoice: { currency: { code: 'CNY' }, total_amount: 100, seller: { country: 'China' }, buyer: { country: 'Russia' }, items: [{ quantity: 1, line_total: 100 }] } })
    expect(draft['g15-code']).toBe('CN')
    expect(draft['g1-proc']).toBe('')
    expect(draft['g22-sum']).toBe('100')
    expect(draftValue(draft, 'g45-cval')).toBe('')
    expect(draftValue(draft, 'g46-statistical')).toBe('')
  })
  test('calculations require explicitly confirmed complete inputs and preserve zero', () => {
    expect(calculateValuation({ invoiceAmount: 100, exchangeRate: 80 }).customsRub).toBeNull()
    expect(calculateValuation({ confirmed: true, invoiceAmount: 100, additions: 20, deductions: 0, exchangeRate: 80, statisticalAdjustmentRub: -100, usdRate: 100 })).toEqual({ customsRub: 9600, statisticalUsd: 95 })
    expect(calculatePayments([{ kind: '2010', base: 1000, ratePercent: 5, method: 'ИУ', confirmed: true }])[0]?.amount).toBe(50)
    expect(calculatePayments([{ kind: '2010', base: 1000, ratePercent: 5, method: 'ИУ', confirmed: false }])).toHaveLength(0)
    expect(calculateValuation({ confirmed: true, invoiceAmount: 0, additions: 0, deductions: 0, exchangeRate: 80 }).customsRub).toBe(0)
  })
})
describe('cross-check regressions', () => {
  test.each([
    ['Условия поставки (Incoterms)', ['CIF Vladivostok', 'CIF Shanghai', '—', 'CIF Vladivostok'], 'mismatch'],
    ['Продавец', ['ACME / Berlin / DE', 'ACME / Shanghai / CN', 'ACME / Berlin / DE', 'ACME / Berlin / DE'], 'mismatch'],
    ['Описание товара', ['steel bolts', 'fresh oranges', 'steel bolts', 'steel bolts'], 'mismatch'],
    ['Маршрут', ['Berlin → Moscow', '—', '—', 'Shanghai → Tokyo'], 'mismatch'],
    ['Общий вес брутто, кг', ['—', '—', '1 т', '1 кг'], 'mismatch'],
    ['Общий вес брутто, кг', ['—', '—', '1 т', '1000 кг'], 'ok'],
    ['Номер договора', ['A-1 от 01.01.2026', 'A-1', 'A-1 от 01.01.2026', '—'], 'ok'],
    ['Дата', ['2026-10-10', '11.10.2026', '—', '—'], 'mismatch'],
    ['Дата', ['2026-02-30', '2026-02-30', '—', '—'], 'mismatch'],
  ] as const)('%s: %j', (attribute, values, expected) => expect(evaluateComparisonRow(row(attribute, [...values])).status).toBe(expected))
  test('zero is a value; invalid and missing numbers are not successful zero checks', () => {
    expect(evaluateComparisonRow(row('Сумма', ['0', '0', '—', '—'], 'number')).status).toBe('ok')
    expect(evaluateComparisonRow(row('Сумма', ['unknown', 'unknown', '—', '—'], 'number')).status).toBe('mismatch')
  })
  test('different addresses remain a conflict even when AI marks them ok; explanation survives', () => {
    const input = row('Адрес', ['Main street 1', 'Main street 2', '—', '—'], 'address')
    const output = applyCrossCheckResult([input], [{ ...input, cellStatuses: ['ok', 'ok', 'ignored', 'ignored'], issue: 'Check building numbers', recommendation: 'Compare source' }])[0]!
    expect(output.status).toBe('mismatch')
    expect(output.issue).toContain('Check building numbers')
    expect(output.recommendation).toBe('Compare source')
  })
  test('AI semantic review is retained for translated descriptions', () => {
    const input = row('Описание', ['steel bolts', 'стальные болты', '—', '—'], 'goods')
    expect(applyCrossCheckResult([input], [{ ...input, cellStatuses: ['ok', 'ok', 'ignored', 'ignored'], issue: 'Confirmed translation' }])[0]?.status).toBe('ok')
  })
  test('all goods are compared by SKU regardless of row order, including split packages', () => {
    const rows = buildComparisonRowsFromDocuments({ invoice: { items: [{ model_or_sku: 'A-1', description: 'Bolt', quantity: 5 }, { model_or_sku: 'B-2', description: 'Nut', quantity: 2 }] }, packingList: { items: [{ model_or_sku: 'B-2', description: 'Nut', quantity: 1 }, { model_or_sku: 'B-2', description: 'Nut', quantity: 1 }, { model_or_sku: 'A-1', description: 'Bolt', quantity: 5 }] }, cmr: { items: [{ model_or_sku: 'B-2', description: 'Nut', quantity: 99 }, { model_or_sku: 'A-1', description: 'Bolt', quantity: 5 }] } })
    const second = rows.find(value => value.id === 'goods.b2.quantity')!
    expect(second.values.slice(1)).toEqual(['2', '2', '99'])
    expect(evaluateComparisonRow(second).status).toBe('mismatch')
    expect(rows.filter(value => value.id?.startsWith('goods.b2.'))).toHaveLength(7)
    expect(rows.some(value => value.id === 'weight.net')).toBeTrue()
    expect(rows.some(value => value.id === 'amount.total')).toBeTrue()
    expect(rows.some(value => value.id === 'dispatch.country')).toBeTrue()
    expect(rows.some(value => value.id === 'destination.country')).toBeTrue()
  })
})
describe('permanent demo artifact', () => {
  test('stored snapshot is complete and checksum is verified', async () => {
    const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
    expect(validateDemoSnapshot(snapshot).checksum).toBe(demoChecksum(snapshot.payload))
    const corrupt = structuredClone(snapshot); corrupt.payload.declarationDraft['g2-name'] = 'changed'
    expect(() => validateDemoSnapshot(corrupt)).toThrow('Контрольная сумма')
    expect(() => validateDemoSnapshot(null)).toThrow()
  })
  test('demo and health routes have no AI or extraction dependency', async () => {
    for (const path of ['server/api/aideclarant/demo.post.ts', 'server/api/aideclarant/gigachat/health.get.ts']) {
      const source = await Bun.file(path).text()
      expect(source).not.toContain('callGigaChat')
      expect(source).not.toContain('runAiCrossCheck')
      expect(source).not.toContain('extractDocumentWithAi')
    }
  })
})

describe('document consistency and edits', () => {
  test('absence reasons distinguish documents, optional fields and failed recognition', () => {
    const rows = buildComparisonRowsFromDocuments({ invoice: { extraction_issues: ['invoice.date'], invoice_number: 'I-1', items: [] } })
    expect(rows[0]?.id).toBe('documents.present')
    expect(evaluateComparisonRow(rows[0]!).status).toBe('empty')
    expect(rows.find(row => row.id === 'invoice.date')?.absenceReasons).toEqual(['missing-document', 'unrecognized', 'missing-document', 'missing-document'])
    expect(evaluateComparisonRow(rows.find(row => row.id === 'invoice.date')!).cellNotes?.[1]).toContain('нечитаемое')
  })
  test('commercial parties are separate from consignor and consignee', () => {
    const rows = buildComparisonRowsFromDocuments({ agreement: { seller: { name: 'Trading Ltd' } }, invoice: { seller: { name: 'Trading Ltd' } }, packingList: { shipper: { name: 'Factory GmbH' } }, cmr: { consignor: { name: 'Factory GmbH' } } })
    const seller = rows.find(row => row.id === 'sender.name')!
    expect(evaluateComparisonRow(seller).status).toBe('ok')
    expect(seller.draftKeys).toEqual([])
    expect(seller.values[2]).toBe('—')
    expect(evaluateComparisonRow(rows.find(row => row.id === 'consignor.name')!).status).toBe('ok')
    expect(rows.find(row => row.id === 'consignor.name')?.values[3]).toBe('Factory GmbH')
  })
  test('totals detect omitted packages and do not turn incomplete lines into zero', () => {
    const rows = buildComparisonRowsFromDocuments({ packingList: { gross_weight_total: 1240, net_weight_total: 1060, packages: { total_packages: 12 }, items: [{ gross_weight: 600, net_weight: 520, packaging: { packages_qty: 8 } }, { gross_weight: 150, net_weight: 120, packaging: { packages_qty: 2 } }, { gross_weight: 240, net_weight: 200, packaging: { packages_qty: 1 } }] } })
    for (const id of ['internal.gross', 'internal.net', 'internal.packages']) expect(evaluateComparisonRow(rows.find(row => row.id === id)!).status).toBe('mismatch')
    const incomplete = buildComparisonRowsFromDocuments({ invoice: { subtotal_ex_vat: 100, items: [{ quantity: 1, line_total: 100 }, { quantity: 1 }] } })
    expect(evaluateComparisonRow(incomplete.find(row => row.id === 'internal.invoice.amount')!).status).toBe('empty')
  })
  test('invoice multiplication is checked even when totals happen to agree', () => {
    const rows = buildComparisonRowsFromDocuments({ invoice: { subtotal_ex_vat: 100, items: [{ quantity: 2, price_per_unit: 30, line_total: 100 }] } })
    expect(evaluateComparisonRow(rows.find(row => row.id === 'internal.invoice.amount')!).status).toBe('ok')
    expect(evaluateComparisonRow(rows.find(row => row.id === 'internal.invoice.prices')!).status).toBe('mismatch')
  })
  test.each([
    ['5.6 m3', '5600 l', 'ok'], ['5.6 м³', '5.6 m³', 'ok'], ['5.6 litres', '5.6 m³', 'mismatch'], ['5.6 boxes', '5.6 m³', 'mismatch'],
  ] as const)('volume %s and %s', (a, b, expected) => expect(evaluateComparisonRow(row('Объём', ['—', '—', a, b], 'volume')).status).toBe(expected))
  test('reference strings and missing SKU fields normalize without fixing contradictory SKU', async () => {
    const { normalizeDocuments } = await import('../shared/aideclarant/normalize')
    const docs = normalizeDocuments({ invoice: { contract_reference: 'Договор № A-1 от 10.10.2026', items: [{ description: 'Pneumatic unit GM-PN-U20' }] }, cmr: { items: [{ model_or_sku: 'GM-PN-U2010', quantity: 120 }] } })
    expect(docs.invoice?.contract_reference).toEqual({ number: 'A-1', date: '2026-10-10' })
    expect((docs.invoice?.items as any[])[0].model_or_sku).toBe('GM-PN-U20')
    const rows = buildComparisonRowsFromDocuments(docs)
    expect(rows.some(row => row.id === 'goods.gmpnu2010.quantity')).toBeTrue()
  })
  test('an edited source updates draft and internal checks while manual form edits survive', async () => {
    const { applyComparisonEdit } = await import('../shared/aideclarant/comparison')
    const docs = { invoice: { contract_reference: 'A-1 от 10.10.2026', seller: { name: 'A' }, items: [{ model_or_sku: 'AB-1', quantity: 2, price_per_unit: 5, line_total: 10 }], subtotal_ex_vat: 10 } }
    const original = buildDeclarationDraftFromDocuments(docs)
    const changed = applyComparisonEdit(docs, buildComparisonRowsFromDocuments(docs).find(row => row.id === 'goods.ab1.quantity')!, 1, '3')
    const next = buildDeclarationDraftFromDocuments(changed)
    const merged = mergeGeneratedDraft(updateDraftValue(original, 'g2-name', 'Manual'), original, next)
    expect(draftValue(merged, 'g41-quantity')).toBe('3')
    expect(merged['g2-name']).toBe('Manual')
    expect(evaluateComparisonRow(buildComparisonRowsFromDocuments(changed).find(row => row.id === 'internal.invoice.prices')!).status).toBe('mismatch')
    expect((changed.invoice?.contract_reference as any).date).toBe('2026-10-10')
    expect((docs.invoice.items[0]!).quantity).toBe(2)
  })
  test('form consistency covers payments, places, transport, count and procedures', async () => {
    const { declarationChecks } = await import('../shared/aideclarant/declaration')
    const draft = createEmptyDraft()
    Object.assign(draft, { 'g1-proc': '40', 'g5-goods': '9', 'g3-total': '5', 'g6-pkg': '12', 'g19-cont': '1', 'g18-vehicle': 'ABC', 'gB-payments': '2010 / 40 / RUB / DOC-1' })
    Object.assign(draft, { 'goods.0.g31-desc': 'Товар\nМест: 10', 'goods.0.g37-procedure': '80/00', 'goods.0.g47-payments': '2010 / 1000 / 5% / 50 / ИУ', 'goods.0.g42-amount': '100', 'g22-sum': '200' })
    const checks = declarationChecks(draft).map(check => check.id)
    for (const id of ['goods-count', 'sheets', 'procedure-0', 'g22-sum', 'places', 'containers', 'transport-departure', 'payments-b-2010']) expect(checks).toContain(id)
  })
})

test('partial article matches and duplicate billing lines never allocate the same packed weight twice', async () => {
  const { matchingItems } = await import('../shared/aideclarant/data')
  expect(matchingItems([{ description: 'Part A-10' }], { model_or_sku: 'A-1' })).toHaveLength(0)
  const documents = { invoice: { items: [{ model_or_sku: 'AB-1', quantity: 1, line_total: 5 }, { model_or_sku: 'AB-1', quantity: 2, line_total: 10 }] }, packingList: { items: [{ model_or_sku: 'AB-1', quantity: 3, gross_weight: 100 }] } }
  const draft = buildDeclarationDraftFromDocuments(documents)
  expect(draftValue(draft, 'g35-gross', 0)).toBe('')
  expect(draftValue(draft, 'g35-gross', 1)).toBe('')
  expect(evaluateComparisonRow(buildComparisonRowsFromDocuments(documents).find(row => row.id === 'internal.invoice.duplicates')!).status).toBe('mismatch')
})

test('source edits preserve manual goods structure and target the remaining SKU after deletion', () => {
  const documents = { invoice: { items: [{ model_or_sku: 'AB-1', description: 'First', quantity: 1 }, { model_or_sku: 'CD-2', description: 'Second', quantity: 2 }] } }
  const original = buildDeclarationDraftFromDocuments(documents)
  const edited = removeGoodsAt(original, 0)
  const merged = mergeGeneratedDraft(edited, original, buildDeclarationDraftFromDocuments(documents))
  expect(merged.goodsCount).toBe('1')
  expect(draftValue(merged, 'g31-desc')).toContain('CD-2')
  const secondRow = buildComparisonRowsFromDocuments(documents).find(row => row.id === 'goods.cd2.quantity')!
  const updated = applyComparisonValueToDraft(merged, secondRow, '9')
  expect(draftValue(updated, 'g41-quantity')).toBe('9')
  const removedRow = buildComparisonRowsFromDocuments(documents).find(row => row.id === 'goods.ab1.quantity')!
  expect(draftValue(applyComparisonValueToDraft(updated, removedRow, '7'), 'g41-quantity')).toBe('9')
})
