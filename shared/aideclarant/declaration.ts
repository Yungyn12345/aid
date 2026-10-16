import { allDeclarationControls, goodsControlKeys } from './schema'
import { addressCountry, countryCode, countryName, first, formatNumber, get, isObject, items, matchingItems, normalizeText, numberValue, sum, text, weightKg } from './data'
import { normalizeDocuments } from './normalize'
import type { ComparisonRow, DeclarationDraft, ExtractedDocuments } from './types'

export const goodsKey = (index: number, key: string) => `goods.${index}.${key}`
export const draftValue = (draft: DeclarationDraft, key: string, index = 0) => draft[goodsControlKeys.has(key) ? goodsKey(index, key) : key] || ''
export const formatGraph54 = (draft: DeclarationDraft) => [
  [draft['g54-certificate-number'] && `Свидетельство № ${draft['g54-certificate-number']}`, draft['g54-certificate-date'] && `от ${draft['g54-certificate-date']}`, draft['g54-inn'] && `ИНН/КПП ${draft['g54-inn']}`].filter(Boolean).join(' '),
  [draft['g54-contract-number'] && `Договор № ${draft['g54-contract-number']}`, draft['g54-contract-date'] && `от ${draft['g54-contract-date']}`].filter(Boolean).join(' '),
  ['g54-surname', 'g54-firstname', 'g54-patronymic', 'g54-position', 'g54-phone'].map(key => draft[key]).filter(Boolean).join(', '),
  ['g54-identity-code', 'g54-identity-name', 'g54-identity-series', 'g54-identity-number', 'g54-identity-date', 'g54-identity-issuer'].map(key => draft[key]).filter(Boolean).join(' '),
  [draft['g54-authority-name'], draft['g54-authority-number'] && `№ ${draft['g54-authority-number']}`, draft['g54-authority-from'] && `от ${draft['g54-authority-from']}`, draft['g54-authority-to'] && `до ${draft['g54-authority-to']}`].filter(Boolean).join(' '),
].filter(Boolean).join('\n')
export const recalculateDraft = (input: DeclarationDraft): DeclarationDraft => {
  const draft = { ...input }
  const count = Number(draft.goodsCount) || 1
  draft['g5-goods'] = String(count); draft['g3-sheet'] ||= '1'; draft['g3-total'] = String(1 + Math.ceil(Math.max(0, count - 1) / 3))
  for (let index = 0; index < count; index++) draft[goodsKey(index, 'g32-num')] = String(index + 1)
  for (const [key, target] of [['g45-cval', 'g12-total']]) {
    const total = sum(Array.from({ length: count }, (_, index) => draftValue(draft, key!, index)))
    if (total !== null) draft[target!] = formatNumber(total)
  }
  draft['g54-print'] = formatGraph54(draft)
  return draft
}
export const createEmptyDraft = (count = 1): DeclarationDraft => {
  const draft: DeclarationDraft = { schemaVersion: '2', goodsCount: String(count) }
  for (const control of allDeclarationControls) {
    if (control.goods) for (let index = 0; index < count; index++) draft[goodsKey(index, control.key)] = ''
    else draft[control.key] = control.type === 'checkbox' ? 'false' : ''
  }
  return recalculateDraft(draft)
}
const legacyKeys: Record<string, string> = {
  'Адрес': 'g2-addr', 'ИНН/КПП': 'g2-inn', '__receiver__Адрес': 'g8-addr', '__receiver__ИНН/КПП': 'g8-inn',
  '11 Торговая страна': 'g11-trade', '12 Общая таможенная стоимость': 'g12-total', '13 Условия': 'g20-place',
  '23 Курс валюты': 'g23-rate', '24 Характер сделки': 'g24-code', '29 Таможня на границе': 'g29-office', '30 Местонахождение товаров': 'g30-location',
  '31 Грузовые места и описание товаров': 'g31-desc', '33 ТН ВЭД': 'g33-tnved', '34 Страна происх.': 'g34-origin',
  '35 Вес брутто': 'g35-gross', '38 Вес нетто': 'g38-net', '39 Квота': 'g39-quota', '40 Предшествующий документ': 'g40-previous',
  '41 Доп. единица измерения': 'g41-unit', 'Количество': 'g41-quantity', '42 Цена товара': 'g42-amount', '44 Дополнительная информация / документы': 'g44-documents',
  '45 Таможенная стоимость': 'g45-cval', '46 Статистическая стоимость': 'g46-statistical', '47 Исчисление платежей': 'g47-payments', '48 Отсрочка платежей': 'g48-deferral',
}
export const canonicalDraft = (input: DeclarationDraft): DeclarationDraft => {
  const count = Math.max(1, Math.min(1000, Math.floor(numberValue(input.goodsCount) || 1)))
  const draft = createEmptyDraft(count)
  if (input.schemaVersion === '2') {
    for (const key of Object.keys(draft)) if (typeof input[key] === 'string') draft[key] = input[key]!
    if (input.goodsStructureEdited === 'true') draft.goodsStructureEdited = 'true'
  } else {
    for (const [old, key] of Object.entries(legacyKeys)) if (input[old]) draft[goodsControlKeys.has(key) ? goodsKey(0, key) : key] = input[old]!
    const parts = input['1 Декларация']?.split(/\s+/) || []
    draft['g1-dir'] = parts[0] || ''; draft['g1-proc'] = parts[1] || ''
    const currencyTotal = input['22 Валюта и общая сумма']?.match(/^([A-Z]{3})\s+(.+)$/)
    if (currencyTotal) { draft['g22-cur'] = currencyTotal[1]!; draft['g22-sum'] = currencyTotal[2]! }
  }
  return draft
}
export const resizeGoods = (input: DeclarationDraft, requested: number): DeclarationDraft => {
  const count = Math.max(1, Math.min(1000, Math.floor(requested) || 1))
  const draft: DeclarationDraft = { ...createEmptyDraft(count), ...input, goodsCount: String(count), goodsStructureEdited: 'true' }
  for (const key of Object.keys(draft)) if (key.startsWith('goods.') && Number(key.split('.')[1]) >= count) delete draft[key]
  for (let index = 0; index < count; index++) for (const key of goodsControlKeys) draft[goodsKey(index, key)] ??= ''
  return recalculateDraft(draft)
}
export const removeGoodsAt = (input: DeclarationDraft, removed: number) => {
  const count = Number(input.goodsCount) || 1
  if (count <= 1) return input
  const draft = { ...input }
  for (let index = removed; index < count - 1; index++) for (const key of goodsControlKeys) draft[goodsKey(index, key)] = draftValue(input, key, index + 1)
  return resizeGoods(draft, count - 1)
}
export const updateDraftValue = (input: DeclarationDraft, key: string, value: string, index = 0): DeclarationDraft => {
  if (key === 'g5-goods') return /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 1000 ? resizeGoods(input, Number(value)) : input
  const draft = { ...input, [goodsControlKeys.has(key) ? goodsKey(index, key) : key]: value }
  return key.startsWith('g54-') || ['g42-amount', 'g45-cval'].includes(key) ? recalculateDraft(draft) : draft
}
const entityAddress = (value: unknown) => isObject(value) ? first(value.legal_address, value.address) : text(value)
const itemNumber = (item: unknown, ...paths: string[]) => paths.map(path => get(item, path)).find(value => numberValue(value) !== null)
export type ValuationInputs = { confirmed?: boolean; invoiceAmount?: number; additions?: number; deductions?: number; exchangeRate?: number; statisticalAdjustmentRub?: number; usdRate?: number }
export const calculateValuation = (input: ValuationInputs) => {
  if (!input.confirmed || [input.invoiceAmount, input.additions, input.deductions, input.exchangeRate].some(value => typeof value !== 'number' || !Number.isFinite(value)) || [input.invoiceAmount, input.additions, input.deductions].some(value => value! < 0) || input.exchangeRate! <= 0) return { customsRub: null, statisticalUsd: null }
  const customsRub = Math.round((input.invoiceAmount! + input.additions! - input.deductions!) * input.exchangeRate! * 100) / 100
  if (customsRub < 0) return { customsRub: null, statisticalUsd: null }
  const statisticalUsd = typeof input.statisticalAdjustmentRub === 'number' && Number.isFinite(input.statisticalAdjustmentRub) && typeof input.usdRate === 'number' && Number.isFinite(input.usdRate) && input.usdRate > 0 && customsRub + input.statisticalAdjustmentRub >= 0 ? Math.round((customsRub + input.statisticalAdjustmentRub) / input.usdRate * 100) / 100 : null
  return { customsRub, statisticalUsd }
}
export type PaymentInput = { kind: string; base: number; ratePercent: number; method: string; confirmed: boolean }
export const calculatePayments = (rows: PaymentInput[]) => rows.filter(row => row.confirmed && Number.isFinite(row.base) && row.base >= 0 && Number.isFinite(row.ratePercent) && row.ratePercent >= 0).map(row => ({ ...row, amount: Math.round(row.base * row.ratePercent) / 100 }))

export const buildDeclarationDraftFromDocuments = (input: ExtractedDocuments): DeclarationDraft => {
  const documents = normalizeDocuments(input)
  const invoiceItems = items(documents.invoice); const packingItems = items(documents.packingList)
  const cargoItems = invoiceItems.length ? invoiceItems : packingItems
  let draft = createEmptyDraft(Math.max(1, cargoItems.length))
  for (const [prefix, party] of [
    ['g2', get(documents.cmr, 'consignor') || get(documents.invoice, 'seller') || get(documents.agreement, 'seller')],
    ['g8', get(documents.cmr, 'consignee') || get(documents.invoice, 'buyer') || get(documents.agreement, 'buyer')],
    ['g14', get(documents.agreement, 'declarant') || get(documents.agreement, 'buyer') || get(documents.invoice, 'buyer')],
  ] as const) {
    draft[`${prefix}-name`] = text(get(party, 'name')); draft[`${prefix}-addr`] = entityAddress(party)
    const related = Object.values(documents).flatMap(doc => ['seller', 'buyer', 'shipper', 'consignor', 'consignee', 'declarant'].map(role => get(doc, role))).filter(value => isObject(value) && normalizeText(text(value.name)) === normalizeText(text(get(party, 'name'))))
    const identifier = (key: string) => first(get(party, key), ...related.map(value => get(value, key)))
    draft[`${prefix}-ogrn`] = identifier('ogrn'); draft[`${prefix}-inn`] = [identifier('inn'), identifier('kpp')].filter(Boolean).join('/')
  }
  const sender = get(documents.cmr, 'consignor') || get(documents.invoice, 'seller')
  const receiver = get(documents.cmr, 'consignee') || get(documents.invoice, 'buyer')
  const route = get(documents.cmr, 'route_countries')
  const dispatch = first(get(documents.cmr, 'dispatch_country'), get(documents.cmr, 'place_and_date_taking_over.country'), Array.isArray(route) ? route[0] : '', addressCountry(sender))
  const destination = first(get(documents.cmr, 'destination_country'), get(documents.cmr, 'place_of_delivery.country'), Array.isArray(route) ? route.at(-1) : '', addressCountry(receiver))
  draft['g15-code'] = countryCode(dispatch); draft['g15-name'] = countryName(dispatch)
  draft['g17-code'] = countryCode(destination); draft['g17-name'] = countryName(destination)
  draft['g11-trade'] = addressCountry(get(documents.agreement, 'seller') || get(documents.invoice, 'seller'))
  const origins = [...new Set(cargoItems.map(item => countryCode(item.origin_country || get(documents.agreement, 'origin_country'))).filter(Boolean))]
  draft['g16-origin'] = origins.length > 1 ? 'РАЗНЫЕ' : origins[0] ? countryName(origins[0]) : ''
  draft['g1-dir'] = first(get(documents.invoice, 'declaration.direction'), draft['g17-code'] === 'RU' && draft['g15-code'] && draft['g15-code'] !== 'RU' ? 'ИМ' : draft['g15-code'] === 'RU' && draft['g17-code'] && draft['g17-code'] !== 'RU' ? 'ЭК' : '')
  draft['g1-proc'] = text(get(documents.invoice, 'declaration.procedure')); draft['g1-ed'] = text(get(documents.invoice, 'declaration.electronic'))
  draft['g6-pkg'] = first(get(documents.packingList, 'packages.total_packages'), get(documents.cmr, 'packages_summary.number_of_packages'))
  draft['g9-party'] = text(get(documents.agreement, 'financial_responsible'))
  const terms = get(documents.agreement, 'incoterms') || get(documents.invoice, 'incoterms')
  draft['g20-code'] = text(get(terms, 'rule')); draft['g20-place'] = text(get(terms, 'place'))
  draft['g22-cur'] = first(get(documents.invoice, 'currency.code'), get(documents.agreement, 'currency.code'))
  draft['g22-sum'] = formatNumber(numberValue(get(documents.invoice, 'total_amount') ?? get(documents.invoice, 'grand_total')))
  draft['g23-rate'] = text(get(documents.invoice, 'exchange_rate.rate') ?? get(documents.invoice, 'exchange_rate'))
  const vehicle = [get(documents.cmr, 'transport.tractor_plate'), get(documents.cmr, 'transport.trailer_plate')].map(text).filter(Boolean).join(' / ')
  draft['g18-vehicle'] = first(get(documents.cmr, 'transport.departure_vehicle'), vehicle); draft['g18-country'] = countryCode(get(documents.cmr, 'transport.plate_country_code'))
  draft['g21-vehicle'] = first(get(documents.cmr, 'transport.border_vehicle'), vehicle); draft['g21-country'] = countryCode(get(documents.cmr, 'transport.border_plate_country_code') || get(documents.cmr, 'transport.plate_country_code'))
  draft['g25-mode'] = text(get(documents.cmr, 'transport.mode_code_border')); draft['g26-mode'] = text(get(documents.cmr, 'transport.mode_code_inland'))
  const containers = get(documents.cmr, 'transport.containers'); const indicator = get(documents.cmr, 'transport.container_indicator')
  draft['g19-cont'] = indicator === 0 || indicator === 1 ? String(indicator) : Array.isArray(containers) ? (containers.length ? '1' : '0') : ''
  draft['g24-code'] = text(get(documents.agreement, 'transaction_code')); draft['g24-feature'] = text(get(documents.agreement, 'transaction_feature'))
  draft['g30-location'] = text(get(documents.cmr, 'goods_location'))
  const docs44 = ([['agreement', 'contract_number', 'contract_date', 'Контракт'], ['invoice', 'invoice_number', 'invoice_date', 'Инвойс'], ['packingList', 'pl_number', 'pl_date', 'Упаковочный лист'], ['cmr', 'cmr_number', 'cmr_date', 'CMR']] as const).map(([kind, number, date, label]) => [label, text(get(documents[kind], number)), text(get(documents[kind], date))].filter(Boolean).join(' — ')).join('\n')
  cargoItems.forEach((item, index) => {
    const unique = matchingItems(cargoItems, item).length === 1
    const packed = unique ? matchingItems(packingItems, item) : []; const transported = unique ? matchingItems(items(documents.cmr), item) : []
    const weight = (net: boolean) => {
      const paths = net ? ['net_weight_kg', 'net_weight'] : ['gross_weight_kg', 'gross_weight']
      const own = itemNumber(item, ...paths)
      if (own !== undefined) return formatNumber(weightKg(own))
      const list = packed.length ? packed : transported
      return formatNumber(sum(list.map(part => weightKg(itemNumber(part, ...paths)))))
    }
    const set = (key: string, value: unknown) => { draft[goodsKey(index, key)] = text(value) }
    const places = sum(packed.map(part => get(part, 'packaging.packages_qty')))
    set('g31-desc', [text(item.description), text(item.model_or_sku), item.quantity !== undefined ? `${text(item.quantity)} ${text(item.uom)}` : '', places !== null ? `Мест: ${formatNumber(places)}` : '', first(get(documents.packingList, 'packages.marks_and_numbers'), get(documents.cmr, 'packages_summary.marks_and_numbers')), Array.isArray(containers) && containers.length ? `Контейнеры: ${containers.map(text).join(', ')}` : ''].filter(Boolean).join('\n'))
    set('g34-origin', countryCode(item.origin_country || get(documents.agreement, 'origin_country'))); set('g35-gross', weight(false)); set('g38-net', weight(true))
    set('g33-tnved', item.tnved_code); set('g36-preference', item.preference_code)
    set('g37-procedure', item.procedure_code || (draft['g1-proc'] ? `${draft['g1-proc']}/00` : '')); set('g37-movement', item.movement_code)
    set('g41-unit', item.uom); set('g41-quantity', item.quantity); set('g42-amount', item.line_total ?? item.total_amount)
    set('g40-previous', item.previous_document); set('g43-method', item.customs_valuation_method); set('g44-documents', docs44)
    const valuation = calculateValuation(isObject(item.customs_valuation) ? item.customs_valuation as ValuationInputs : {})
    set('g45-cval', item.customs_value_rub ?? formatNumber(valuation.customsRub)); set('g46-statistical', item.statistical_value_usd ?? formatNumber(valuation.statisticalUsd))
    const paymentInputs = Array.isArray(item.payments) ? item.payments.filter(isObject) as unknown as PaymentInput[] : []
    set('g47-payments', calculatePayments(paymentInputs).map(payment => `${payment.kind} / ${payment.base} / ${payment.ratePercent}% / ${payment.amount.toFixed(2)} / ${payment.method}`).join('\n'))
  })
  draft = recalculateDraft(draft)
  return draft
}
export const mergeGeneratedDraft = (current: DeclarationDraft, previous: DeclarationDraft, next: DeclarationDraft) => {
  const merged = { ...next }
  for (const [key, value] of Object.entries(current)) if (key !== 'goodsCount' && value !== previous[key] && key in merged) merged[key] = value
  if (current.goodsStructureEdited === 'true') {
    for (const key of Object.keys(merged)) if (key.startsWith('goods.')) delete merged[key]
    for (const [key, value] of Object.entries(current)) if (key.startsWith('goods.')) merged[key] = value
    merged.goodsCount = current.goodsCount!
    merged.goodsStructureEdited = 'true'
  }
  return recalculateDraft(merged)
}
export const applyComparisonValueToDraft = (input: DeclarationDraft, row: ComparisonRow, value: string) => {
  const draft = { ...input }
  for (let key of row.draftKeys || []) {
    if (key.startsWith('goods.') && input.goodsStructureEdited === 'true') {
      const matches = Array.from({ length: Number(input.goodsCount) || 1 }, (_, index) => index).filter(index => row.sku && matchingItems([{ description: draftValue(input, 'g31-desc', index) }], { model_or_sku: row.sku }).length)
      if (matches.length !== 1) continue
      key = key.replace(/^goods\.\d+\./, `goods.${matches[0]}.`)
    }
    if ((key.endsWith('-code') || key.endsWith('-origin')) && row.kind === 'country') draft[key] = countryCode(value)
    else if (key === 'g15-name' || key === 'g17-name' || key === 'g16-origin') draft[key] = countryName(value)
    else if (row.id?.endsWith('.inn') && key.endsWith('-inn')) draft[key] = [value === '—' ? '' : value, input[key]?.split('/')[1]].filter(Boolean).join('/')
    else if (row.id?.endsWith('.kpp') && key.endsWith('-inn')) draft[key] = [input[key]?.split('/')[0], value === '—' ? '' : value].filter(Boolean).join('/')
    else if (row.kind === 'goods' && key.endsWith('.g31-desc') && row.sku && input[key]?.includes('\n' + row.sku)) draft[key] = (value === '—' ? '' : value) + input[key]!.slice(input[key]!.indexOf('\n' + row.sku))
    else draft[key] = value === '—' ? '' : value
  }
  return recalculateDraft(draft)
}
export type DeclarationCheck = { id: string; message: string }
export const declarationChecks = (draft: DeclarationDraft): DeclarationCheck[] => {
  const checks: DeclarationCheck[] = []; const add = (id: string, message: string) => checks.push({ id, message })
  const count = Number(draft.goodsCount) || 1
  if (draft.goodsStructureEdited === 'true') add('manual-goods', 'Список товаров изменён вручную: после правок исходных данных проверьте распределение весов и стоимости по карточкам. Правки сравнения привязываются к однозначному артикулу.')
  if (numberValue(draft['g5-goods']) !== count) add('goods-count', 'Графа 5 не совпадает с количеством товарных карточек.')
  if (numberValue(draft['g3-total']) !== 1 + Math.ceil(Math.max(0, count - 1) / 3)) add('sheets', 'Проверьте общее число листов в графе 3 по количеству товаров.')
  const assessed = new Map<string, number>()
  for (let index = 0; index < count; index++) {
    const val = (key: string) => draftValue(draft, key, index)
    const net = numberValue(val('g38-net')); const gross = numberValue(val('g35-gross'))
    if (numberValue(val('g32-num')) !== index + 1) add(`number-${index}`, `Товар ${index + 1}: нарушена последовательность номеров графы 32.`)
    if (net !== null && net < 0 || gross !== null && gross < 0) add(`weight-negative-${index}`, `Товар ${index + 1}: вес не может быть отрицательным.`)
    if (net !== null && gross !== null && net > gross) add(`weight-${index}`, `Товар ${index + 1}: нетто превышает брутто.`)
    if (draft['g1-proc'] && val('g37-procedure') && !val('g37-procedure').startsWith(draft['g1-proc']!)) add(`procedure-${index}`, `Товар ${index + 1}: процедура графы 37 не совпадает с графой 1.`)
    if (draft['g16-origin'] && !/разные|неизвестна/i.test(draft['g16-origin']!) && val('g34-origin') && countryCode(draft['g16-origin']) !== countryCode(val('g34-origin'))) add(`origin-${index}`, `Товар ${index + 1}: страна происхождения графы 34 расходится с графой 16.`)
    if (!val('g45-cval')) add(`customs-${index}`, `Товар ${index + 1}: таможенная стоимость не рассчитана — нужны подтверждённые расходы, курс или ручное значение графы 45.`)
    if (!val('g46-statistical')) add(`statistical-${index}`, `Товар ${index + 1}: статистическая стоимость не рассчитана — нужны данные для графы 46.`)
    for (const [lineIndex, line] of val('g47-payments').split('\n').entries()) {
      const parts = line.split('/').map(part => part.trim()); const base = numberValue(parts[1]); const rate = numberValue(parts[2]); const amount = numberValue(parts[3])
      if (/^\d{4}$/.test(parts[0] || '') && amount !== null) assessed.set(parts[0]!, (assessed.get(parts[0]!) || 0) + amount)
      if (parts[2]?.includes('%') && base !== null && rate !== null && amount !== null && Math.abs(base * rate / 100 - amount) > 0.01) add(`payment-${index}-${lineIndex}`, `Товар ${index + 1}: сумма платежа не совпадает с базой и ставкой.`)
    }
  }
  const places = Array.from({ length: count }, (_, index) => draftValue(draft, 'g31-desc', index).match(/(?:^|\n)Мест:\s*(\d+(?:[.,]\d+)?)/i)?.[1])
  const placeTotal = sum(places)
  if (placeTotal !== null && numberValue(draft['g6-pkg']) !== null && placeTotal !== numberValue(draft['g6-pkg'])) add('places', 'Количество мест в графах 31 не совпадает с графой 6; проверьте в том числе совместные грузовые места.')
  if (assessed.size && !draft['gB-payments']) add('payments-b-missing', 'Графа 47 заполнена: укажите подтверждённые реквизиты уплаты в графе B либо основание отсрочки/условного начисления.')
  const paid = new Map<string, number>()
  for (const line of (draft['gB-payments'] || '').split('\n')) {
    const match = line.match(/^\s*(\d{4})\s*[/–—]\s*([\d\s.,]+)\s*[/–—]\s*(RUB|643)\b/i)
    if (match && numberValue(match[2]) !== null) paid.set(match[1]!, (paid.get(match[1]!) || 0) + numberValue(match[2])!)
  }
  for (const [kind, amount] of paid) if (assessed.has(kind) && Math.abs(assessed.get(kind)! - amount) > 0.01) add(`payments-b-${kind}`, `Платёж ${kind}: графы 47 и B расходятся. Проверьте уплату, отсрочку и способ начисления.`)
  for (const [key, totalKey, label] of [['g42-amount', 'g22-sum', 'Сумма граф 42 должна совпадать с графой 22'], ['g45-cval', 'g12-total', 'Сумма граф 45 должна совпадать с графой 12']]) {
    const total = sum(Array.from({ length: count }, (_, index) => draftValue(draft, key!, index)))
    if (total !== null && numberValue(draft[totalKey!]) !== null && Math.abs(total - numberValue(draft[totalKey!])!) > 0.01) add(totalKey!, label!+'.')
  }
  if (draft['g19-cont'] === '1' && !Array.from({ length: count }, (_, index) => draftValue(draft, 'g31-desc', index)).some(description => /контейнер|container/i.test(description))) add('containers', 'Графа 19: укажите номера контейнеров в графе 31.')
  if (draft['g19-cont'] && !['0', '1'].includes(draft['g19-cont'])) add('container-code', 'Графа 19: допустим только признак 0 или 1.')
  if (draft['g18-vehicle'] && !draft['g18-country']) add('transport-departure', 'Графа 18: уточните страну регистрации транспортного средства.')
  if (draft['g21-vehicle'] && !draft['g21-country']) add('transport-border', 'Графа 21: уточните страну регистрации транспортного средства на границе.')
  return checks
}
