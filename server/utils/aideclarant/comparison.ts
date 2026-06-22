import { documentOrder, type ComparisonCellStatus, type ComparisonRow, type CrossCheckResult, type DocumentType, type ExtractedDocuments } from './types'

const EMPTY = '—'

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

const findRelatedDocument = (doc: unknown, type: string) => {
  const related = get(doc, 'related_documents')

  if (!Array.isArray(related)) {
    return undefined
  }

  const lowerType = type.toLowerCase()

  return related.find((item) => {
    if (!isObject(item)) {
      return false
    }

    return String(item.type || '').toLowerCase().includes(lowerType)
  })
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

const normalizeForLocalCheck = (attribute: string, value: string) => {
  if (isEmptyCell(value)) {
    return ''
  }

  const lowerAttribute = attribute.toLowerCase()

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

const complementaryAttributes = new Set([
  'Дата отгрузки / принятия груза перевозчиком',
  'Описание товара',
  'Маршрут',
])

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

export const evaluateComparisonRow = (row: ComparisonRow): ComparisonRow => {
  const normalizedValues = row.values.map((value) => normalizeForLocalCheck(row.attribute, value))
  const filledUniqueValues = Array.from(new Set(normalizedValues.filter(Boolean)))

  if (complementaryAttributes.has(row.attribute)) {
    const cellStatuses: ComparisonCellStatus[] = row.values.map((value) => isEmptyCell(value) ? 'ignored' : 'ok')

    return {
      ...row,
      cellStatuses,
      status: cellStatuses.some((status) => status === 'ok') ? 'ok' : 'ignored',
      issue: '',
      recommendation: '',
    }
  }

  const hasMismatch = filledUniqueValues.length > 1
  const majorityValue = hasMismatch ? chooseStatusByMajority(normalizedValues) : null

  const cellStatuses: ComparisonCellStatus[] = row.values.map((value, index) => {
    if (isEmptyCell(value)) {
      return 'ignored'
    }

    if (!hasMismatch) {
      return 'ok'
    }

    if (majorityValue) {
      return normalizedValues[index] === majorityValue ? 'ok' : 'mismatch'
    }

    return 'mismatch'
  })

  return {
    ...row,
    cellStatuses,
    status: cellStatuses.some((status) => status === 'mismatch') ? 'mismatch' : 'ok',
    issue: '',
    recommendation: '',
  }
}

export const summarizeCrossCheckRows = (rows: ComparisonRow[]) => {
  const mismatchCount = rows.filter((row) => row.cellStatuses?.some((status) => status === 'mismatch' || status === 'empty')).length

  return mismatchCount > 0
    ? `ИИ-проверка выявила ${mismatchCount} строк(и) с реальными расхождениями.`
    : 'ИИ-проверка не выявила критичных расхождений.'
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
