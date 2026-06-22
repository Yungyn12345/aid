import type { DeclarationDraft, ExtractedDocuments } from './types'

const isObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const get = (source: unknown, path: string): unknown => {
  if (!isObject(source)) {
    return undefined
  }

  return path.split('.').reduce<unknown>((current, key) => {
    if (!isObject(current)) {
      return undefined
    }

    return current[key]
  }, source)
}

const firstArrayItem = (source: unknown, path: string): unknown => {
  const value = get(source, path)

  return Array.isArray(value) ? value[0] : undefined
}

const toText = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join(', ')
  }

  if (isObject(value)) {
    const parts = [
      value.name,
      value.legal_address,
      value.address,
      value.place,
      value.country,
      value.code,
      value.rule,
      value.version,
      value.number,
      value.date,
    ]
      .map(toText)
      .filter(Boolean)

    return parts.join(', ')
  }

  return String(value)
}

const first = (...values: unknown[]) => {
  for (const value of values) {
    const text = toText(value)

    if (text) {
      return text
    }
  }

  return ''
}

const numberText = (value: unknown, suffix = '') => {
  const text = toText(value)

  if (!text) {
    return ''
  }

  return suffix && !text.toLowerCase().includes(suffix.toLowerCase()) ? `${text} ${suffix}` : text
}

const formatDate = (value: unknown) => {
  const text = toText(value)
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return text
  }

  return `${match[3]}.${match[2]}.${match[1]}`
}

const entity = (value: unknown) => {
  if (!isObject(value)) {
    return toText(value)
  }

  return [
    value.name,
    value.legal_address || value.address,
    value.country,
  ].map(toText).filter(Boolean).join(', ')
}

const postalCode = (value: unknown) => {
  const text = entity(value)
  return text.match(/\b\d{5,6}\b/)?.[0] || ''
}

const cityOrRegion = (value: unknown) => {
  const text = entity(value)

  if (/berlin/i.test(text)) {
    return 'Berlin'
  }

  if (/москва/i.test(text)) {
    return 'Москва'
  }

  return ''
}

const innKpp = (value: unknown) => {
  if (!isObject(value)) {
    return ''
  }

  const inn = toText(value.inn || value.vat_or_reg_number || value.vat_or_tax_id)
  const kpp = toText(value.kpp)

  return [inn, kpp].filter(Boolean).join(' / ')
}

const countryCode = (value: unknown) => {
  const text = toText(value).toLowerCase()

  if (!text) {
    return ''
  }

  if (/germany|германия|de\b/.test(text)) {
    return 'DE'
  }

  if (/russia|россия|ru\b/.test(text)) {
    return 'RU'
  }

  return toText(value)
}

const incotermsText = (value: unknown) => {
  if (!isObject(value)) {
    return toText(value)
  }

  return [value.rule, value.place, value.version].map(toText).filter(Boolean).join(' ')
}

const contractRef = (source: unknown) => {
  const number = first(get(source, 'contract_reference.number'), get(source, 'contract_number'))
  const date = first(get(source, 'contract_reference.date'), get(source, 'contract_date'))

  return [number, date ? `от ${formatDate(date)}` : ''].filter(Boolean).join(' ')
}

const invoiceRef = (source: unknown) => {
  const number = first(get(source, 'invoice_ref.number'), get(source, 'invoice_number'))
  const date = first(get(source, 'invoice_ref.date'), get(source, 'invoice_date'))

  return [number, date ? `от ${formatDate(date)}` : ''].filter(Boolean).join(' ')
}

const sumItems = (source: unknown, field: string) => {
  const items = get(source, 'items')

  if (!Array.isArray(items)) {
    return ''
  }

  const sum = items.reduce((acc, item) => {
    const value = get(item, field)

    return typeof value === 'number' && Number.isFinite(value) ? acc + value : acc
  }, 0)

  return sum > 0 ? String(sum) : ''
}

const goodsDescription = (documents: ExtractedDocuments) => {
  const invoiceItems = get(documents.invoice, 'items')
  const packingItems = get(documents.packingList, 'items')

  const items = Array.isArray(invoiceItems) && invoiceItems.length
    ? invoiceItems
    : Array.isArray(packingItems)
      ? packingItems
      : []

  if (!items.length) {
    return first(
      get(documents.agreement, 'subject'),
      get(firstArrayItem(documents.invoice, 'items'), 'description'),
      get(firstArrayItem(documents.packingList, 'items'), 'description'),
    )
  }

  const lines = items.map((item, index) => {
    const description = first(get(item, 'description'))
    const model = first(get(item, 'model_or_sku'))
    const quantity = first(get(item, 'quantity'))
    const uom = first(get(item, 'uom'))
    const origin = first(get(item, 'origin_country'))
    const manufacturer = first(get(item, 'manufacturer'))

    return [
      `${index + 1}.`,
      description,
      model ? `модель/артикул: ${model}` : '',
      quantity ? `кол-во: ${quantity}${uom ? ` ${uom}` : ''}` : '',
      origin ? `страна происхождения: ${origin}` : '',
      manufacturer ? `производитель: ${manufacturer}` : '',
    ].filter(Boolean).join(' ')
  })

  const packages = first(
    get(documents.packingList, 'packages.total_packages'),
    get(documents.cmr, 'packages_summary.number_of_packages'),
  )
  const gross = first(get(documents.packingList, 'gross_weight_total'), get(documents.cmr, 'gross_weight_total_kg'))
  const net = first(get(documents.packingList, 'net_weight_total'), get(documents.cmr, 'net_weight_total_kg'))
  const marks = first(get(documents.packingList, 'packages.marks_and_numbers'), get(documents.cmr, 'packages_summary.marks_and_numbers'))

  return [
    items.length ? items.length > 1 ? 'Сборная партия товаров:' : 'Товар:' : '',
    ...lines,
    packages ? `Всего мест: ${packages}.` : '',
    gross ? `Вес брутто: ${gross} кг.` : '',
    net ? `Вес нетто: ${net} кг.` : '',
    marks ? `Маркировка: ${marks}.` : '',
  ].filter(Boolean).join('\n')
}

const documents44 = (documents: ExtractedDocuments) => {
  const contract = contractRef(documents.agreement)
  const invoice = invoiceRef(documents.invoice)
  const packingList = invoiceRef({ invoice_ref: get(documents.packingList, 'invoice_ref') })
  const cmrNumber = first(get(documents.cmr, 'cmr_number'))
  const cmrDate = first(get(documents.cmr, 'cmr_date'))

  return [
    contract ? `Контракт: ${contract}` : '',
    invoice ? `Инвойс: ${invoice}` : '',
    packingList ? `Упаковочный лист / ссылка на инвойс: ${packingList}` : '',
    cmrNumber || cmrDate ? `CMR: ${[cmrNumber, cmrDate ? `от ${formatDate(cmrDate)}` : ''].filter(Boolean).join(' ')}` : '',
  ].filter(Boolean).join('\n')
}

export const buildDeclarationDraftFromDocuments = (documents: ExtractedDocuments): DeclarationDraft => {
  const seller = first(get(documents.agreement, 'seller'), get(documents.invoice, 'seller'), get(documents.cmr, 'consignor'))
  const buyer = first(get(documents.agreement, 'buyer'), get(documents.invoice, 'buyer'), get(documents.cmr, 'consignee'))
  const sellerRaw = get(documents.agreement, 'seller') || get(documents.invoice, 'seller') || get(documents.cmr, 'consignor')
  const buyerRaw = get(documents.agreement, 'buyer') || get(documents.invoice, 'buyer') || get(documents.cmr, 'consignee')
  const invoiceItems = get(documents.invoice, 'items')
  const firstInvoiceItem = firstArrayItem(documents.invoice, 'items')
  const currency = first(get(documents.invoice, 'currency.code'), get(documents.agreement, 'currency.code'))
  const totalAmount = first(get(documents.invoice, 'total_amount'), get(documents.invoice, 'grand_total'))
  const incoterms = first(get(documents.invoice, 'incoterms'), get(documents.agreement, 'incoterms'), get(documents.cmr, 'special_instructions'))
  const firstPackingItem = firstArrayItem(documents.packingList, 'items')
  const origin = first(get(firstInvoiceItem, 'origin_country'), get(firstPackingItem, 'origin_country'), get(documents.agreement, 'origin_and_manufacturer'))
  const netWeight = first(get(documents.packingList, 'net_weight_total'), get(documents.cmr, 'net_weight_total_kg'))
  const grossWeight = first(get(documents.packingList, 'gross_weight_total'), get(documents.cmr, 'gross_weight_total_kg'))
  const routeCountries = get(documents.cmr, 'route_countries')
  const routeText = Array.isArray(routeCountries) ? routeCountries.join(' → ') : ''
  const totalQuantity = Array.isArray(invoiceItems) ? invoiceItems.reduce((acc, item) => {
    const value = get(item, 'quantity')
    return typeof value === 'number' ? acc + value : acc
  }, 0) : 0
  const itemsCount = Array.isArray(invoiceItems) ? invoiceItems.length : ''

  return {
    'Страна': countryCode(sellerRaw),
    'Почтовый код': postalCode(sellerRaw),
    'Область, район, населённый пункт': cityOrRegion(sellerRaw),
    'Адрес': seller,
    'ИНН/КПП': innKpp(sellerRaw),
    'ОКПО': '',

    '__receiver__Страна': countryCode(buyerRaw),
    '__receiver__Почтовый код': postalCode(buyerRaw),
    '__receiver__Область, район, населённый пункт': cityOrRegion(buyerRaw),
    '__receiver__Адрес': buyer,
    '__receiver__ИНН/КПП': innKpp(buyerRaw),
    '__receiver__ОКПО': '',

    '1 Декларация': 'ИМ 40',
    'A Внутренний номер': invoiceRef(documents.invoice) || contractRef(documents.agreement),
    '3 Форма': 'ДТ',
    '4 Спец. процедура': '',
    'B Регистрационный номер': '',
    '5 Всего товаров': toText(itemsCount),
    '6 Вес нетто': numberText(netWeight, 'кг'),
    '7 Особенности декларирования': '',
    '9 Лицо, от имени которого подаётся декларация': buyer,

    '18 Вид транспорта при отправлении': first(get(documents.cmr, 'transport.mode_code_inland'), get(documents.agreement, 'transport_terms.mode'), '30'),
    '21 Вид транспорта на границе': first(get(documents.cmr, 'transport.mode_code_border'), '30'),
    '22 Валюта и общая сумма': [currency, totalAmount].filter(Boolean).join(' '),
    '23 Курс валюты': '',
    '24 Характер сделки': '010',
    '29 Таможня на границе': '',
    '30 Местонахождение товаров': first(get(documents.cmr, 'place_of_delivery'), buyer),
    '15 Страна отправления / 16 Страна происхождения / 17 Страна назначения': [
      first(get(documents.cmr, 'transport.plate_country_code'), 'DE'),
      countryCode(origin),
      countryCode(buyerRaw),
    ].filter(Boolean).join(' / '),

    '11 Торговая страна': countryCode(sellerRaw),
    '12 Общая таможенная стоимость': [totalAmount, currency].filter(Boolean).join(' '),
    '13 Условия': incotermsText(incoterms),

    '31 Грузовые места и описание товаров': goodsDescription(documents),
    '32 Товар №': '1',
    '33 ТН ВЭД': '',
    '34 Страна происх.': countryCode(origin),
    '35 Вес брутто': numberText(grossWeight, 'кг'),
    '38 Вес нетто': numberText(netWeight, 'кг'),
    'Количество': totalQuantity ? String(totalQuantity) : sumItems(documents.invoice, 'quantity'),
    'Ед. изм.': first(get(firstInvoiceItem, 'uom'), 'pcs'),
    '39 Квота': '',
    '40 Предшествующий документ': invoiceRef(documents.invoice),
    '41 Доп. единица измерения': first(get(firstInvoiceItem, 'uom'), 'pcs'),
    '42 Цена товара': [totalAmount, currency].filter(Boolean).join(' '),
    '44 Дополнительная информация / документы': documents44(documents),

    '47 Исчисление платежей': '',
    '48 Отсрочка платежей': '',
    '45 Таможенная стоимость': [totalAmount, currency].filter(Boolean).join(' '),
    '46 Статистическая стоимость': [totalAmount, currency].filter(Boolean).join(' '),
    'Информация о декларанте': buyer,

    'Таможенный представитель': '',
    'Договор с клиентом': contractRef(documents.agreement),
    'Декларант': '',
    'Документ, удостоверяющий личность': '',
    'Документ, подтверждающий полномочия': '',
    'Отметки таможни': '',
    'Решение по ДТ': '',
  }
}
