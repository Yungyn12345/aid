import { countryCode, first, formatNumber, get, isObject, items, matchingItems, normalizeText, normalizeUnit, numberValue, setPath, skuKey, sum, text, volumeM3, weightKg } from './data'
import { documentOrder, type ComparisonCellStatus, type ComparisonRow, type CrossCheckResult, type DocumentType, type ExtractedDocuments } from './types'
import { goodsKey } from './declaration'
import { normalizeDocuments } from './normalize'

const EMPTY = '—'
export const isEmptyComparisonValue = (value: string) => !value.trim() || value.trim() === EMPTY
export const formatComparisonValue = (value: unknown): string => {
  if (isObject(value)) return [value.rule, value.place, value.version, value.name, value.address || value.legal_address, value.country, value.number, value.date, value.code].map(text).filter(Boolean).join(' / ') || EMPTY
  return text(value) || EMPTY
}
type Paths = string[][]
export const buildComparisonRowsFromDocuments = (input: ExtractedDocuments): ComparisonRow[] => {
  const documents = normalizeDocuments(input)
  const rows: ComparisonRow[] = []
  const add = (id: string, attribute: string, paths: Paths, kind: ComparisonRow['kind'] = 'text', draftKeys: string[] = [], applicable = paths.map(list => list.length > 0)) => {
    const bindings = documentOrder.map((document, column) => {
      const candidates = paths[column] || []
      const path = candidates.find(candidate => text(get(documents[document], candidate)) !== '') || candidates[0]
      return path ? { document, paths: [path], numeric: ['number', 'weight', 'volume'].includes(kind || '') } : null
    })
    const values = bindings.map(binding => binding ? formatComparisonValue(get(documents[binding.document], binding.paths[0]!)) : EMPTY)
    rows.push({ id, attribute, kind, values, bindings, draftKeys, applicable })
  }
  add('contract.number', 'Номер договора', [['contract_number'], ['contract_reference.number'], ['contract_reference.number'], []], 'reference', [], [true, true, false, false])
  add('contract.date', 'Дата договора', [['contract_date'], ['contract_reference.date'], ['contract_reference.date'], []], 'date', [], [true, true, false, false])
  add('invoice.number', 'Номер инвойса', [[], ['invoice_number'], ['invoice_ref.number'], []], 'reference', [], [false, true, true, false])
  add('invoice.date', 'Дата инвойса', [[], ['invoice_date'], ['invoice_ref.date'], []], 'date', [], [false, true, true, false])
  add('packing.number', 'Номер упаковочного листа', [[], [], ['pl_number'], []], 'reference', [], [false, false, true, false])
  add('packing.date', 'Дата упаковочного листа', [[], [], ['pl_date'], []], 'date', [], [false, false, true, false])
  for (const [role, title, key, parties] of [
    ['sender', 'Продавец', 'g2', ['seller', 'seller', 'seller', 'seller']],
    ['receiver', 'Покупатель', 'g8', ['buyer', 'buyer', 'buyer', 'buyer']],
  ] as const) {
    const transported = get(documents.cmr, key === 'g2' ? 'consignor.name' : 'consignee.name')
    const target = (suffix: string) => !text(transported) || normalizeText(text(transported)) === normalizeText(first(get(documents.invoice, `${parties[1]}.name`), get(documents.agreement, `${parties[0]}.name`))) ? [`${key}-${suffix}`] : []
    add(`${role}.name`, `${title}: наименование`, parties.map(party => [`${party}.name`]), 'entity', target('name'), [true, true, false, false])
    add(`${role}.address`, `${title}: адрес`, parties.map(party => [`${party}.legal_address`, `${party}.address`]), 'address', target('addr'), [true, true, false, false])
    add(`${role}.inn`, `${title}: ИНН`, parties.map(party => [`${party}.inn`]), 'identifier', target('inn'), [false, false, false, false])
    add(`${role}.kpp`, `${title}: КПП`, parties.map(party => [`${party}.kpp`]), 'identifier', target('inn'), [false, false, false, false])
    add(`${role}.vat`, `${title}: иностранный налоговый / регистрационный номер`, parties.map(party => [`${party}.vat_or_reg_number`, `${party}.vat_or_tax_id`]), 'identifier', [], [false, false, false, false])
    add(`${role}.ogrn`, `${title}: ОГРН`, parties.map(party => [`${party}.ogrn`]), 'identifier', target('ogrn'), [false, false, false, false])
    add(`${role}.country`, `${title}: страна`, parties.map(party => [`${party}.country_code`, `${party}.country`]), 'country', [], [false, false, false, false])
  }
  for (const [role, title, key] of [['consignor', 'Грузоотправитель', 'g2'], ['consignee', 'Грузополучатель', 'g8']] as const) {
    const packingRole = role === 'consignor' ? 'shipper' : 'consignee'
    for (const [part, label, kind, suffix] of [['name', 'наименование', 'entity', 'name'], ['address', 'адрес', 'address', 'addr'], ['inn', 'ИНН', 'identifier', 'inn'], ['kpp', 'КПП', 'identifier', 'inn'], ['ogrn', 'ОГРН', 'identifier', 'ogrn'], ['vat_or_tax_id', 'иностранный налоговый номер', 'identifier', ''], ['country', 'страна', 'country', '']] as const) add(`${role}.${part}`, `${title}: ${label}`, [[], [], part === 'address' ? [`${packingRole}.address`, `${packingRole}.legal_address`] : [`${packingRole}.${part}`], part === 'address' ? [`${role}.address`, `${role}.legal_address`] : [`${role}.${part}`]], kind, suffix ? [`${key}-${suffix}`] : [], [false, false, false, part === 'name' || part === 'address'])
  }
  add('dispatch.country', 'Страна отправления', [['dispatch_country'], ['dispatch_country'], ['dispatch_country'], ['dispatch_country', 'place_and_date_taking_over.country', 'route_countries.0', 'consignor.country']], 'country', ['g15-name', 'g15-code'], [false, false, false, true])
  add('destination.country', 'Страна назначения', [['destination_country'], ['destination_country', 'buyer.country'], ['destination_country'], ['destination_country', 'place_of_delivery.country', 'consignee.country']], 'country', ['g17-name', 'g17-code'], [false, false, false, true])
  for (const [part, label] of [['rule', 'условие'], ['place', 'место'], ['version', 'версия']] as const) add(`incoterms.${part}`, `Инкотермс: ${label}`, [[`incoterms.${part}`], [`incoterms.${part}`], [], [`incoterms.${part}`]], part === 'place' ? 'address' : 'text', part === 'rule' ? ['g20-code'] : part === 'place' ? ['g20-place'] : [], [true, true, false, false])
  add('currency', 'Валюта', [['currency.code'], ['currency.code'], [], []], 'currency', ['g22-cur'])
  add('amount.total', 'Общая сумма', [['total_amount'], ['total_amount', 'grand_total'], ['total_amount'], ['total_amount']], 'number', ['g22-sum'], [false, true, false, false])
  add('packages.total', 'Общее количество мест', [[], [], ['packages.total_packages', 'packages_summary.number_of_packages'], ['packages_summary.number_of_packages']], 'number', ['g6-pkg'])
  add('weight.gross', 'Общий вес брутто, кг', [[], ['gross_weight_total_kg'], ['gross_weight_total', 'cargo_summary.total_gross_weight_kg'], ['gross_weight_total_kg']], 'weight', [], [false, false, true, true])
  add('weight.net', 'Общий вес нетто, кг', [[], ['net_weight_total_kg'], ['net_weight_total', 'cargo_summary.total_net_weight_kg'], ['net_weight_total_kg']], 'weight', [], [false, false, true, false])
  add('volume', 'Общий объём, м³', [[], [], ['dimensions_total.volume_m3', 'dimensions_total'], ['transport.volume_m3']], 'volume')
  add('marking', 'Маркировка грузовых мест', [[], [], ['packages.marks_and_numbers', 'marks_and_numbers'], ['packages_summary.marks_and_numbers']], 'identifier')
  add('shipment.date', 'Дата принятия груза перевозчиком', [['shipment_date'], ['shipment_date'], ['shipment_date'], ['place_and_date_taking_over.date']], 'date', [], [false, false, false, true])
  add('cmr.date', 'Дата транспортного документа', [[], [], [], ['cmr_date']], 'date')
  add('route', 'Маршрут', [['route_countries'], ['route_countries'], ['route_countries'], ['route_countries']], 'route', [], [false, false, false, true])
  add('transport.vehicle', 'Транспортное средство', [[], [], [], ['transport.tractor_plate']], 'identifier', ['g18-vehicle'])
  add('transport.country', 'Страна регистрации ТС', [[], [], [], ['transport.plate_country_code']], 'country', ['g18-country'])
  const invoiceItems = items(documents.invoice)
  const catalog = invoiceItems.length ? invoiceItems : items(documents.packingList)
  const all = documentOrder.map(kind => items(documents[kind]))
  const seen = new Set<string>()
  const candidates = [...catalog, ...all.flat()]
  for (const candidate of candidates) {
    const anchor = catalog.find(item => matchingItems([candidate], item).length) || candidate
    const identity = skuKey(anchor.model_or_sku) || skuKey(anchor.description)
    if (!identity || seen.has(identity)) continue
    seen.add(identity)
    const index = catalog.indexOf(anchor)
    const selected = all.map(list => matchingItems(list, anchor))
    const itemTitle = first(anchor.model_or_sku, anchor.description)
    const groups = selected.map((matches, column) => matches.map(match => all[column]!.indexOf(match)))
    const addItem = (suffix: string, label: string, paths: string[], kind: ComparisonRow['kind'], target?: string, aggregate = false) => {
      const values = selected.map(matches => {
        const data = matches.map(item => paths.map(path => get(item, path)).find(value => text(value) !== ''))
        return aggregate ? formatNumber(sum(kind === 'weight' ? data.map(weightKg) : data)) || EMPTY : [...new Set(data.map(formatComparisonValue).filter(value => value !== EMPTY))].join('; ') || EMPTY
      })
      const bindings = documentOrder.map((document, column) => groups[column]?.length ? { document, paths: groups[column]!.map(itemIndex => `items.${itemIndex}.${paths.find(path => text(get(all[column]![itemIndex], path)) !== '') || paths[0]}`), numeric: aggregate } : null)
      rows.push({ id: `goods.${identity}.${suffix}`, attribute: `${itemTitle}: ${label}`, kind, sku: text(anchor.model_or_sku), values, bindings, applicable: [false, true, true, true], draftKeys: target && index >= 0 ? [goodsKey(index, target)] : [] })
    }
    addItem('description', 'описание', ['description'], 'goods', 'g31-desc')
    addItem('quantity', 'количество', ['quantity'], 'number', 'g41-quantity', true)
    addItem('unit', 'единица измерения', ['uom'], 'text', 'g41-unit')
    addItem('origin', 'происхождение', ['origin_country'], 'country', 'g34-origin')
    addItem('gross', 'брутто, кг', ['gross_weight_kg', 'gross_weight'], 'weight', 'g35-gross', true)
    addItem('net', 'нетто, кг', ['net_weight_kg', 'net_weight'], 'weight', 'g38-net', true)
    addItem('amount', 'сумма строки', ['line_total', 'total_amount'], 'number', 'g42-amount', true)
    for (const row of rows.slice(-7)) {
      if (row.id?.endsWith('.origin') || row.id?.endsWith('.gross') || row.id?.endsWith('.net') || row.id?.endsWith('.amount')) row.applicable = row.id?.endsWith('.amount') ? [false, true, false, false] : [false, false, row.id?.endsWith('.origin') ? false : true, false]
    }
  }
  // Preserve links from transport documents when they exist; do not substitute CMR dates.
  const related = get(documents.cmr, 'related_documents')
  if (Array.isArray(related)) for (const row of rows) {
    if (!['contract.number', 'contract.date', 'invoice.number', 'invoice.date', 'packing.number', 'packing.date'].includes(row.id || '')) continue
    const prefix = row.id!.split('.')[0]!
    const ref = related.find(value => isObject(value) && new RegExp(prefix === 'contract' ? 'contract|договор' : prefix === 'invoice' ? 'invoice|инвойс' : 'packing|упаков', 'i').test(text(value.type)))
    if (isObject(ref)) { row.values[3] = formatComparisonValue(ref[row.kind === 'date' ? 'date' : 'number']); row.applicable![3] = false }
  }
  const consistency = (id: string, attribute: string, values: Array<{ declared: unknown; calculated: number | null } | null>) => {
    const cellChecks = values.map(value => !value ? 'ignored' as const : numberValue(value.declared) === null || value.calculated === null ? 'empty' as const : Math.abs(numberValue(value.declared)! - value.calculated) < 0.01 ? 'ok' as const : 'mismatch' as const)
    rows.push({ id, attribute, values: values.map(value => !value ? EMPTY : `Указано: ${formatComparisonValue(value.declared)}; по строкам: ${formatNumber(value.calculated) || EMPTY}`), cellChecks, applicable: values.map(Boolean) })
  }
  const charges = get(documents.invoice, 'charges')
  const noCharges = !charges || Array.isArray(charges) && charges.length === 0
  const subtotal = get(documents.invoice, 'subtotal_ex_vat') ?? get(documents.invoice, 'items_total') ?? (numberValue(get(documents.invoice, 'vat_amount')) === 0 && noCharges ? get(documents.invoice, 'total_amount') : undefined)
  consistency('internal.invoice.amount', 'Инвойс: сумма товарных строк', [null, documents.invoice ? { declared: subtotal, calculated: sum(invoiceItems.map(item => item.line_total ?? item.total_amount)) } : null, null, null])
  consistency('internal.invoice.prices', 'Инвойс: количество × цена за единицу', [null, invoiceItems.length && invoiceItems.every(item => numberValue(item.quantity) !== null && numberValue(item.price_per_unit ?? item.unit_price) !== null) ? { declared: sum(invoiceItems.map(item => item.line_total ?? item.total_amount)), calculated: sum(invoiceItems.map(item => numberValue(item.quantity)! * numberValue(item.price_per_unit ?? item.unit_price)!)) } : null, null, null])
  invoiceItems.forEach((item, index) => consistency(`internal.invoice.line.${index}`, `Инвойс, строка ${index + 1}: количество × цена`, [null, { declared: item.line_total ?? item.total_amount, calculated: numberValue(item.quantity) !== null && numberValue(item.price_per_unit ?? item.unit_price) !== null ? numberValue(item.quantity)! * numberValue(item.price_per_unit ?? item.unit_price)! : null }, null, null]))
  const duplicateSkus = [...new Set(invoiceItems.filter(item => text(item.model_or_sku) && matchingItems(invoiceItems, item).length > 1).map(item => text(item.model_or_sku)))]
  if (duplicateSkus.length) rows.push({ id: 'internal.invoice.duplicates', attribute: 'Инвойс: повторяющиеся артикулы', values: [EMPTY, duplicateSkus.join('; '), EMPTY, EMPTY], cellChecks: ['ignored', 'mismatch', 'ignored', 'ignored'], issue: 'Повторяющиеся артикулы: проверьте дубли или распределение партий и весов вручную.' })
  for (const [suffix, title, paths, totalPaths] of [
    ['gross', 'брутто', ['gross_weight_kg', 'gross_weight'], ['gross_weight_total_kg', 'gross_weight_total', 'cargo_summary.total_gross_weight_kg']],
    ['net', 'нетто', ['net_weight_kg', 'net_weight'], ['net_weight_total_kg', 'net_weight_total', 'cargo_summary.total_net_weight_kg']],
    ['packages', 'количество мест', ['packaging.packages_qty'], ['packages.total_packages', 'packages_summary.number_of_packages']],
  ] as const) consistency(`internal.${suffix}`, `Сводный итог ↔ строки: ${title}`, documentOrder.map(kind => {
    const list = items(documents[kind]); const declared = totalPaths.map(path => get(documents[kind], path)).find(value => text(value) !== '')
    if (!list.length || declared === undefined) return null
    const values = list.map(item => paths.map(path => get(item, path)).find(value => text(value) !== ''))
    return { declared, calculated: sum(suffix === 'packages' ? values : values.map(weightKg)) }
  }))
  rows.unshift({ id: 'documents.present', attribute: 'Наличие исходного документа', values: documentOrder.map(kind => documents[kind] ? 'Документ загружен' : EMPTY), applicable: [true, true, true, true] })
  for (const row of rows) row.absenceReasons = documentOrder.map((kind, column) => !documents[kind] ? 'missing-document' : !isEmptyComparisonValue(row.values[column] || '') ? null : row.applicable?.[column] === false ? 'not-applicable' : Array.isArray(documents[kind]?.extraction_issues) && (documents[kind]!.extraction_issues as string[]).some(issue => text(issue).includes(row.id || row.attribute) || row.bindings?.[column]?.paths.some(path => text(issue).includes(path))) ? 'unrecognized' : 'missing-value')
  return rows
}
const inferKind = (row: ComparisonRow): NonNullable<ComparisonRow['kind']> => row.kind || (/инкотермс|incoterms|условия поставки/i.test(row.attribute) ? 'incoterms' : /дата/i.test(row.attribute) ? 'date' : /вес/i.test(row.attribute) ? 'weight' : /объ[её]м/i.test(row.attribute) ? 'volume' : /количество|сумма/i.test(row.attribute) ? 'number' : /описание/i.test(row.attribute) ? 'goods' : /маршрут/i.test(row.attribute) ? 'route' : /продавец|покупатель|получатель/i.test(row.attribute) ? 'entity' : /номер/i.test(row.attribute) ? 'reference' : 'text')
const dateKey = (value: string) => {
  const iso = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  const ru = value.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/)
  const parts = iso ? [iso[1], iso[2], iso[3]] : ru ? [ru[3], ru[2], ru[1]] : null
  if (!parts) return null
  const result = parts.join('-'); const date = new Date(result + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === result ? result : null
}
const routeCountries = (value: string) => {
  const parts = value.split(/\s*(?:→|>|,|;|\/)\s*/).filter(Boolean)
  return parts.length > 1 && parts.every(part => countryCode(part)) ? parts.map(countryCode).join('>') : ''
}
const normalize = (row: ComparisonRow, value: string): string | null => {
  if (isEmptyComparisonValue(value)) return ''
  const kind = inferKind(row)
  if (kind === 'weight') { const number = weightKg(value); return number === null ? null : String(number) }
  if (kind === 'volume') { const number = volumeM3(value); return number === null ? null : String(number) }
  if (kind === 'number') { const number = numberValue(value); return number === null ? null : String(number) }
  if (kind === 'date') return dateKey(value)
  if (kind === 'country') return countryCode(value) || normalizeText(value)
  if (kind === 'route') return routeCountries(value) || normalizeText(value)
  if (kind === 'identifier' || kind === 'currency') return value.replace(/\s/g, '').toUpperCase()
  if (kind === 'reference') return normalizeText(value.replace(/\s+от\s+.*$/iu, '').replace(/\([^)]*\)/g, '')).replace(/\s/g, '')
  if (kind === 'incoterms') return normalizeText(value.replace(/\((?!incoterms)[^)]*\)/gi, ''))
  if (kind === 'goods' && row.sku) return normalizeText(value.normalize('NFKC').replace(new RegExp(row.sku.normalize('NFKC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ''))
  if (kind === 'address') return value.split(/[,/]/).map(part => countryCode(part) || normalizeText(part)).filter(Boolean).join(' ')
  if (/единица измерения/i.test(row.attribute)) return normalizeUnit(value)
  return normalizeText(value)
}
export const isAllowedEmptyComparisonCell = (attribute: string, column: number, row?: ComparisonRow) => row?.applicable ? row.applicable[column] === false : (column < 2 && /вес|мест|объ[её]м|маркировк|принятия груза|отгрузки/i.test(attribute)) || (column === 3 && /номер договора|номер инвойса|валюта/i.test(attribute)) || (column === 2 && /инкотермс|условия поставки|валюта|маршрут/i.test(attribute))
export const allowedEmptyComparisonAttributes = Object.fromEntries(documentOrder.map(kind => [kind, new Set<string>()])) as Record<DocumentType, Set<string>>
const overlap = (left: string, right: string) => {
  const a = new Set(left.split(/[^\p{L}\p{N}]+/u).filter(Boolean)); const b = new Set(right.split(/[^\p{L}\p{N}]+/u).filter(Boolean))
  return [...a].filter(word => b.has(word)).length / (new Set([...a, ...b]).size || 1)
}
const descriptionContains = (left: string, right: string) => {
  const a = new Set(left.split(/[^\p{L}\p{N}]+/u).filter(Boolean)); const b = new Set(right.split(/[^\p{L}\p{N}]+/u).filter(Boolean))
  return Math.min(a.size, b.size) >= 2 && ([...a].every(word => b.has(word)) || [...b].every(word => a.has(word)))
}
const rowStatus = (statuses: ComparisonCellStatus[]) => (['mismatch', 'empty', 'similar', 'ok', 'unchecked', 'ignored'] as const).find(status => statuses.includes(status)) || 'ignored'
export const evaluateComparisonRow = (row: ComparisonRow): ComparisonRow => {
  const notes = { 'missing-document': 'Документ не загружен.', 'not-applicable': 'Поле не обязательно для этого типа документа.', 'missing-value': 'Значение не найдено в извлечённых данных; проверьте оригинал.', unrecognized: 'Распознавание отметило это поле как нечитаемое.' }
  const cellNotes = row.absenceReasons?.map(reason => reason ? notes[reason] : '')
  if (row.cellChecks) {
    const status = rowStatus(row.cellChecks)
    return { ...row, cellNotes, status, cellStatuses: row.cellChecks, issue: status === 'mismatch' ? row.issue || 'Значения не совпадают с расчётом по товарным строкам.' : status === 'empty' ? 'Для внутренней проверки недостаточно числовых данных.' : '', recommendation: status === 'mismatch' || status === 'empty' ? 'Проверьте строки и итоги исходного документа.' : '' }
  }
  const normalized = row.values.map(value => normalize(row, value))
  const unique = [...new Set(normalized.filter((value): value is string => !!value))]
  const kind = inferKind(row)
  const counts = new Map<string, number>(); normalized.forEach(value => { if (value) counts.set(value, (counts.get(value) || 0) + 1) })
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const majority = ranked[0] && ranked[0][1] > 1 && ranked[0][1] > (ranked[1]?.[1] || 0) ? ranked[0][0] : null
  const similar = unique.length > 1 && ['entity', 'address', 'goods', 'text'].includes(kind) && unique.every(value => overlap(unique[0]!, value) >= 0.55 || kind === 'goods' && !!row.sku && descriptionContains(unique[0]!, value)) && (kind !== 'address' || unique.every(value => (value.match(/\d+/g) || []).join() === (unique[0]!.match(/\d+/g) || []).join()))
  const statuses: ComparisonCellStatus[] = row.values.map((value, column) => isEmptyComparisonValue(value) ? isAllowedEmptyComparisonCell(row.attribute, column, row) ? 'ignored' : 'empty' : normalized[column] === null ? 'mismatch' : unique.length <= 1 ? 'ok' : similar ? 'similar' : majority && normalized[column] === majority ? 'ok' : 'mismatch')
  const filled = row.values.filter(value => !isEmptyComparisonValue(value)).length
  if (filled === 1 && !statuses.includes('empty')) statuses.forEach((status, index) => { if (status === 'ok') statuses[index] = 'similar' })
  const status = rowStatus(statuses)
  return { ...row, cellNotes, cellStatuses: statuses, status, issue: status === 'mismatch' ? 'Значения противоречат друг другу либо имеют неверный формат.' : status === 'empty' ? 'Не хватает данных для сравнения в ожидаемом документе.' : status === 'similar' ? filled === 1 ? 'Значение есть только в одном документе; независимого подтверждения нет.' : 'Близкие значения требуют подтверждения специалиста.' : '', recommendation: status === 'mismatch' || status === 'empty' ? 'Проверьте исходные документы и выберите значение для декларации.' : '' }
}
export const summarizeCrossCheckRows = (rows: ComparisonRow[]) => {
  const problems = rows.filter(row => row.status === 'mismatch' || row.status === 'empty').length
  const review = rows.filter(row => row.status === 'similar').length
  return `Проверено строк: ${rows.length}. Расхождения или недостающие данные: ${problems}. Требуют подтверждения: ${review}.`
}
export const localCrossCheckRows = (rows: ComparisonRow[]): CrossCheckResult => {
  const checked = rows.map(evaluateComparisonRow)
  return { rows: checked, summary: summarizeCrossCheckRows(checked), source: 'local' }
}
export const applyCrossCheckResult = (rows: ComparisonRow[], aiRows: ComparisonRow[]): ComparisonRow[] => rows.map(row => {
  const local = evaluateComparisonRow(row)
  const ai = aiRows.find(candidate => row.id && candidate.id === row.id || candidate.attribute === row.attribute)
  if (!ai) return local
  const semantic = ['goods', 'entity', 'address', 'route'].includes(inferKind(row))
  const statuses = local.cellStatuses!.map((status, column) => {
    const suggested = ai.cellStatuses?.[column]
    const addressNumbersDiffer = inferKind(row) === 'address' && new Set(row.values.filter(value => !isEmptyComparisonValue(value)).map(value => (value.match(/\d+/g) || []).join())).size > 1
    const routeCountriesDiffer = inferKind(row) === 'route' && new Set(row.values.map(routeCountries).filter(Boolean)).size > 1
    return semantic && !addressNumbersDiffer && !routeCountriesDiffer && !['empty', 'ignored'].includes(status) && suggested && ['ok', 'similar', 'mismatch'].includes(suggested) ? suggested : status
  })
  return { ...local, status: rowStatus(statuses), cellStatuses: statuses, issue: [local.issue, ai.issue].filter(Boolean).join(' '), recommendation: ai.recommendation || local.recommendation }
})
export const applyComparisonEdit = (documents: ExtractedDocuments, row: ComparisonRow, column: number, value: string): ExtractedDocuments => {
  const copy = normalizeDocuments(documents)
  const binding = row.bindings?.[column]
  if (binding && binding.paths.length === 1) {
    copy[binding.document] ||= {}
    setPath(copy[binding.document]!, binding.paths[0]!, binding.numeric ? numberValue(value) ?? value : value === EMPTY ? '' : value)
  }
  return copy
}
