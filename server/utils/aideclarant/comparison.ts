import { documentOrder, type ComparisonCellStatus, type ComparisonRow, type ComparisonRowStatus, type CrossCheckResult, type DocumentType, type ExtractedDocuments } from './types'

const EMPTY = '—'

const documentTypeByColumnIndex = documentOrder.reduce<Record<number, DocumentType>>((acc, documentType, index) => {
  acc[index] = documentType
  return acc
}, {})

export const allowedEmptyComparisonAttributes: Record<DocumentType, Set<string>> = {
  agreement: new Set([
    'Дата отгрузки / принятия груза перевозчиком',
    'Общее количество мест',
    'Общий вес брутто, кг',
    'Общий объём, м³',
    'Номер договора / инвойса в маркировке',
  ]),
  invoice: new Set([
    'Дата отгрузки / принятия груза перевозчиком',
    'Общее количество мест',
    'Общий вес брутто, кг',
    'Общий объём, м³',
    'Номер договора / инвойса в маркировке',
    'Маршрут',
  ]),
  packingList: new Set([
    'Маршрут',
    'Условия поставки (Incoterms)',
    'Валюта',
  ]),
  cmr: new Set([
    'Номер договора',
    'Номер инвойса',
    'Валюта',
  ]),
}

const semanticReviewAttributes = new Set([
  'Описание товара',
  'Маршрут',
])

const strictDateAttributes = new Set([
  'Дата отгрузки / принятия груза перевозчиком',
])

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

export const formatComparisonValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return EMPTY
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
  }

  if (typeof value === 'string') {
    return value.trim() || EMPTY
  }

  if (Array.isArray(value)) {
    const formatted = value.map(formatComparisonValue).filter((item) => item && item !== EMPTY)
    return formatted.length ? formatted.join(', ') : EMPTY
  }

  if (isObject(value)) {
    const parts = [
      value.name,
      value.legal_address,
      value.address,
      value.country,
      value.rule,
      value.place,
      value.version,
      value.number,
      value.date,
      value.code,
    ]
      .map(formatComparisonValue)
      .filter((item) => item && item !== EMPTY)

    return parts.length ? parts.join(' / ') : EMPTY
  }

  return String(value)
}

const formatNumberWithDate = (number?: unknown, date?: unknown) => {
  const numberText = formatComparisonValue(number)
  const dateText = formatComparisonValue(date)

  if (numberText === EMPTY && dateText === EMPTY) {
    return EMPTY
  }

  if (numberText !== EMPTY && dateText !== EMPTY) {
    return `${numberText} от ${dateText}`
  }

  return numberText !== EMPTY ? numberText : dateText
}

const firstItem = (doc: unknown) => {
  return firstArrayItem(doc, 'items') || firstArrayItem(doc, 'goods') || firstArrayItem(doc, 'products')
}

const route = (doc: unknown) => {
  const countries = get(doc, 'route_countries')
  if (Array.isArray(countries) && countries.length) {
    return countries.join(' → ')
  }

  return formatComparisonValue(get(doc, 'place_of_delivery'))
}

export const buildComparisonRowsFromDocuments = (documents: ExtractedDocuments): ComparisonRow[] => {
  const agreement = documents.agreement || {}
  const invoice = documents.invoice || {}
  const packingList = documents.packingList || {}
  const cmr = documents.cmr || {}

  const invoiceItem = firstItem(invoice)
  const packingItem = firstItem(packingList)
  const cmrItem = firstItem(cmr)

  return [
    {
      attribute: 'Номер договора',
      values: [
        formatNumberWithDate(get(agreement, 'contract_number'), get(agreement, 'contract_date')),
        formatNumberWithDate(get(invoice, 'contract_reference.number'), get(invoice, 'contract_reference.date')),
        formatNumberWithDate(get(packingList, 'contract_reference.number'), get(packingList, 'contract_reference.date')),
        EMPTY,
      ],
    },
    {
      attribute: 'Номер инвойса',
      values: [
        EMPTY,
        formatNumberWithDate(get(invoice, 'invoice_number'), get(invoice, 'invoice_date')),
        formatNumberWithDate(get(packingList, 'invoice_ref.number'), get(packingList, 'invoice_ref.date')),
        EMPTY,
      ],
    },
    {
      attribute: 'Продавец (Consignor / Seller)',
      values: [
        formatComparisonValue(get(agreement, 'seller')),
        formatComparisonValue(get(invoice, 'seller')),
        formatComparisonValue(get(packingList, 'shipper') || get(packingList, 'seller')),
        formatComparisonValue(get(cmr, 'consignor')),
      ],
    },
    {
      attribute: 'Покупатель / Грузополучатель (Consignee)',
      values: [
        formatComparisonValue(get(agreement, 'buyer')),
        formatComparisonValue(get(invoice, 'buyer')),
        formatComparisonValue(get(packingList, 'consignee') || get(packingList, 'buyer')),
        formatComparisonValue(get(cmr, 'consignee')),
      ],
    },
    {
      attribute: 'Условия поставки (Incoterms)',
      values: [
        formatComparisonValue(get(agreement, 'incoterms')),
        formatComparisonValue(get(invoice, 'incoterms')),
        EMPTY,
        formatComparisonValue(get(cmr, 'incoterms')),
      ],
    },
    {
      attribute: 'Валюта',
      values: [
        formatComparisonValue(get(agreement, 'currency')),
        formatComparisonValue(get(invoice, 'currency')),
        EMPTY,
        EMPTY,
      ],
    },
    {
      attribute: 'Дата отгрузки / принятия груза перевозчиком',
      values: [
        EMPTY,
        EMPTY,
        formatComparisonValue(get(packingList, 'pl_date')),
        formatComparisonValue(get(cmr, 'place_and_date_taking_over.date') || get(cmr, 'cmr_date')),
      ],
    },
    {
      attribute: 'Общее количество мест',
      values: [
        EMPTY,
        EMPTY,
        formatComparisonValue(get(packingList, 'packages.total_packages') || get(packingList, 'packages_summary.number_of_packages')),
        formatComparisonValue(get(cmr, 'packages_summary.number_of_packages')),
      ],
    },
    {
      attribute: 'Общий вес брутто, кг',
      values: [
        EMPTY,
        EMPTY,
        formatComparisonValue(get(packingList, 'gross_weight_total') || get(packingList, 'cargo_summary.total_gross_weight_kg')),
        formatComparisonValue(get(cmr, 'gross_weight_total_kg')),
      ],
    },
    {
      attribute: 'Общий объём, м³',
      values: [
        EMPTY,
        EMPTY,
        formatComparisonValue(get(packingList, 'dimensions_total.volume_m3')),
        formatComparisonValue(get(cmr, 'transport.volume_m3')),
      ],
    },
    {
      attribute: 'Описание товара',
      values: [
        formatComparisonValue(get(agreement, 'subject')),
        formatComparisonValue(get(invoiceItem, 'description')),
        formatComparisonValue(get(packingItem, 'description')),
        formatComparisonValue(get(cmrItem, 'description')),
      ],
    },
    {
      attribute: 'Номер договора / инвойса в маркировке',
      values: [
        EMPTY,
        EMPTY,
        formatComparisonValue(get(packingList, 'packages.marks_and_numbers')),
        formatComparisonValue(get(cmr, 'packages_summary.marks_and_numbers')),
      ],
    },
    {
      attribute: 'Маршрут',
      values: [
        formatComparisonValue(get(agreement, 'transport_terms.details') || get(agreement, 'incoterms.place')),
        EMPTY,
        EMPTY,
        route(cmr),
      ],
    },
  ]
}

const isEmptyCell = (value: string) => {
  const normalized = value.trim()
  return !normalized || normalized === EMPTY
}

export const isAllowedEmptyComparisonCell = (attribute: string, columnIndex: number) => {
  const documentType = documentTypeByColumnIndex[columnIndex]

  if (!documentType) {
    return false
  }

  return allowedEmptyComparisonAttributes[documentType].has(attribute)
}

const normalizeNumberLike = (value: string) => {
  const prepared = value
    .replace(/\s/g, '')
    .replace(/≈/g, '')
    .replace(/,/g, (match, offset, text) => {
      const hasDot = text.includes('.')
      return hasDot ? '' : '.'
    })

  const match = prepared.match(/-?\d+(?:\.\d+)?/)

  if (!match) {
    return ''
  }

  const number = Number(match[0])

  return Number.isFinite(number) ? String(number) : ''
}

const normalizeDateLike = (value: string) => {
  return value
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3.$2.$1')
    .replace(/\b(\d{2})\.(\d{2})\.(\d{4})\b/g, '$1.$2.$3')
}

const extractDate = (value: string) => {
  const normalized = normalizeDateLike(value)
  const match = normalized.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/)

  return match ? `${match[1]}.${match[2]}.${match[3]}` : ''
}

const normalizeEntityName = (value: string) => {
  const firstPart = value.split('/')[0] || value

  return firstPart
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/«|»/g, '')
    .replace(/[.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizeIncoterms = (value: string) => {
  const lower = value.toLowerCase()
  const rule = lower.match(/\b(exw|fca|fas|fob|cfr|cif|cpt|cip|dap|dpu|ddp)\b/i)?.[1]?.toLowerCase() || ''
  const place = lower.includes('berlin') ? 'berlin' : ''

  return [rule, place].filter(Boolean).join(' ')
}

const normalizeDocumentReference = (value: string) => {
  return normalizeDateLike(value)
    .toLowerCase()
    .replace(/\bот\b.*$/i, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-zа-я0-9/_-]+/gi, '')
    .trim()
}

const normalizeForLocalCheck = (attribute: string, value: string) => {
  if (isEmptyCell(value)) {
    return ''
  }

  const lowerAttribute = attribute.toLowerCase()

  if (/номер договора|номер инвойса/.test(lowerAttribute)) {
    const reference = normalizeDocumentReference(value)
    return reference || normalizeDateLike(value).toLowerCase().trim()
  }

  if (strictDateAttributes.has(attribute)) {
    return extractDate(value) || normalizeDateLike(value).toLowerCase().trim()
  }

  if (/продавец|покупатель|грузополучатель/.test(lowerAttribute)) {
    return normalizeEntityName(value)
  }

  if (/incoterms|условия поставки/.test(lowerAttribute)) {
    return normalizeIncoterms(value)
  }

  if (/вес|объ[её]м|количество мест/.test(lowerAttribute)) {
    return normalizeNumberLike(value)
  }

  return normalizeDateLike(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/—/g, '')
    .replace(/«|»/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/incoterms®?\s*2020/gi, '')
    .replace(/\s+от\s+/g, ' от ')
    .replace(/russia/g, 'россия')
    .replace(/germany/g, 'германия')
    .replace(/[.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const chooseStatusByMajority = (normalizedValues: string[]) => {
  const counts = new Map<string, number>()

  normalizedValues.forEach((value) => {
    if (!value) {
      return
    }

    counts.set(value, (counts.get(value) || 0) + 1)
  })

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  const [majority] = entries

  if (!majority || entries.length <= 1) {
    return null
  }

  if (majority[1] <= 1) {
    return null
  }

  return majority[0]
}

const tokenizeForSimilarity = (value: string) => {
  return new Set(
    value
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, ' ')
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  )
}

const getJaccardSimilarity = (left: Set<string>, right: Set<string>) => {
  if (!left.size || !right.size) {
    return 0
  }

  let intersection = 0

  left.forEach((token) => {
    if (right.has(token)) {
      intersection += 1
    }
  })

  const union = new Set([...left, ...right]).size

  return union ? intersection / union : 0
}

const hasComparableTextOverlap = (values: string[]) => {
  const tokens = values.map(tokenizeForSimilarity).filter((set) => set.size > 0)

  if (tokens.length < 2) {
    return false
  }

  for (let index = 1; index < tokens.length; index += 1) {
    if (getJaccardSimilarity(tokens[0]!, tokens[index]!) < 0.45) {
      return false
    }
  }

  return true
}

const isSimilarByMeaning = (attribute: string, values: string[], normalizedValues: string[]) => {
  const filledValues = values.filter((value) => !isEmptyCell(value))
  const filledNormalizedValues = normalizedValues.filter(Boolean)
  const filledUniqueValues = Array.from(new Set(filledNormalizedValues))

  if (filledValues.length < 2 || filledUniqueValues.length <= 1) {
    return false
  }

  if (strictDateAttributes.has(attribute)) {
    return false
  }

  if (semanticReviewAttributes.has(attribute)) {
    return true
  }

  if (/номер договора|номер инвойса/.test(attribute.toLowerCase())) {
    const refs = filledValues.map(normalizeDocumentReference).filter(Boolean)
    const uniqueRefs = Array.from(new Set(refs))

    return Boolean(refs.length >= 2 && uniqueRefs.length === 1)
  }

  return hasComparableTextOverlap(filledValues)
}

const getRowStatus = (cellStatuses: ComparisonCellStatus[]): ComparisonRowStatus => {
  if (cellStatuses.some((status) => status === 'mismatch')) {
    return 'mismatch'
  }

  if (cellStatuses.some((status) => status === 'empty')) {
    return 'empty'
  }

  if (cellStatuses.some((status) => status === 'similar')) {
    return 'similar'
  }

  if (cellStatuses.some((status) => status === 'ok')) {
    return 'ok'
  }

  return 'ignored'
}

export const evaluateComparisonRow = (row: ComparisonRow): ComparisonRow => {
  const normalizedValues = row.values.map((value) => normalizeForLocalCheck(row.attribute, value))
  const filledUniqueValues = Array.from(new Set(normalizedValues.filter(Boolean)))
  const hasMismatch = filledUniqueValues.length > 1
  const majorityValue = hasMismatch ? chooseStatusByMajority(normalizedValues) : null
  const shouldMarkAsSimilar = hasMismatch && isSimilarByMeaning(row.attribute, row.values, normalizedValues)

  const cellStatuses: ComparisonCellStatus[] = row.values.map((value, index) => {
    if (isEmptyCell(value)) {
      return isAllowedEmptyComparisonCell(row.attribute, index) ? 'ignored' : 'empty'
    }

    if (!hasMismatch) {
      return 'ok'
    }

    if (shouldMarkAsSimilar) {
      return 'similar'
    }

    if (majorityValue) {
      return normalizedValues[index] === majorityValue ? 'ok' : 'mismatch'
    }

    return 'mismatch'
  })

  return {
    ...row,
    cellStatuses,
    status: getRowStatus(cellStatuses),
    issue: '',
    recommendation: '',
  }
}

export const summarizeCrossCheckRows = (rows: ComparisonRow[]) => {
  const criticalCount = rows.filter((row) => row.cellStatuses?.some((status) => status === 'mismatch' || status === 'empty')).length
  const reviewCount = rows.filter((row) => row.cellStatuses?.some((status) => status === 'similar')).length

  if (criticalCount > 0 && reviewCount > 0) {
    return `ИИ-проверка выявила ${criticalCount} строк(и) с критичными расхождениями и ${reviewCount} строк(и), требующие смысловой проверки.`
  }

  if (criticalCount > 0) {
    return `ИИ-проверка выявила ${criticalCount} строк(и) с критичными расхождениями.`
  }

  if (reviewCount > 0) {
    return `Критичных расхождений нет, но ${reviewCount} строк(и) требуют смысловой проверки.`
  }

  return 'ИИ-проверка не выявила критичных расхождений.'
}

export const localCrossCheckRows = (rows: ComparisonRow[]): CrossCheckResult => {
  const checkedRows = rows.map(evaluateComparisonRow)

  return {
    rows: checkedRows,
    summary: summarizeCrossCheckRows(checkedRows),
    source: 'local-fallback',
  }
}

export const applyCrossCheckResult = (rows: ComparisonRow[], resultRows: ComparisonRow[]): ComparisonRow[] => {
  return rows.map((row) => {
    const checked = resultRows.find((item) => item.attribute === row.attribute)
    const baseRow = checked
      ? {
          ...row,
          issue: checked.issue || '',
          recommendation: checked.recommendation || '',
        }
      : row

    return evaluateComparisonRow(baseRow)
  })
}
