export const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
export const get = (source: unknown, path: string): unknown => path.split('.').reduce<unknown>((value, key) => isObject(value) || Array.isArray(value) ? (value as Record<string, unknown>)[key] : undefined, source)
export const text = (value: unknown): string => value === null || value === undefined ? '' : typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : isObject(value) ? [value.name, value.legal_address || value.address, value.country, value.place, value.code].map(text).filter(Boolean).join(', ') : Array.isArray(value) ? value.map(text).filter(Boolean).join(', ') : ''
export const first = (...values: unknown[]) => values.map(text).find(Boolean) || ''
export const normalizeText = (value: string) => value.normalize('NFKC').toLowerCase().replace(/ё/g, 'е').replace(/[«»"“”'.,;:]/g, '').replace(/\s+/g, ' ').trim()
export const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const raw = text(value).replace(/\u00a0/g, ' ').match(/^[≈\s]*([-+]?\d[\d\s.,]*)/)?.[1]?.replace(/\s/g, '')
  if (!raw) return null
  let clean = raw
  if (raw.includes(',') && raw.includes('.')) {
    const decimal = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? ',' : '.'
    clean = raw.replace(decimal === ',' ? /\./g : /,/g, '').replace(',', '.')
  } else clean = raw.replace(',', '.')
  const result = Number(clean)
  return Number.isFinite(result) ? result : null
}
export const formatNumber = (value: number | null) => value === null ? '' : String(Math.round((value + Number.EPSILON) * 1e6) / 1e6)
export const sum = (values: unknown[]) => values.length && values.every(value => numberValue(value) !== null) ? values.reduce<number>((total, value) => total + numberValue(value)!, 0) : null
export const weightKg = (value: unknown) => {
  const numeric = numberValue(value)
  if (numeric === null) return null
  const units = text(value).replace(/[\d\s.,≈+-]/g, '').toLowerCase()
  if (!units || /^(kg|kgs|кг|kilograms?)$/.test(units)) return numeric
  if (/^(т|t|tonnes?|tons?)$/.test(units)) return numeric * 1000
  if (/^(g|гр|г|grams?)$/.test(units)) return numeric / 1000
  return null
}
export const volumeM3 = (value: unknown) => {
  const numeric = numberValue(value)
  if (numeric === null) return null
  const units = text(value).replace(/^[≈\s]*[-+]?\d[\d\s.,]*/, '').replace(/\s/g, '').toLowerCase()
  if (!units || /^(m³|м³|m\^?3|м\^?3|cbm|куб\.?м)$/.test(units)) return numeric
  if (/^(l|л|litres?|liters?)$/.test(units)) return numeric / 1000
  if (/^(cm³|см³|cm\^?3|см\^?3)$/.test(units)) return numeric / 1_000_000
  return null
}
export const normalizeUnit = (value: unknown) => /^(pcs?|pieces?|шт\.?|штук)$/i.test(text(value)) ? 'pcs' : normalizeText(text(value))
const regionNames = new Map<string, string>()
for (const locale of ['ru', 'en', 'de', 'zh']) {
  const display = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' })
  for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b)
    const name = display.of(code)
    if (name && name !== code && !/^unknown|неизвест/i.test(name)) { regionNames.set(normalizeText(name), code); regionNames.set(code.toLowerCase(), code) }
  }
}
for (const [name, code] of [['россия', 'RU'], ['рф', 'RU'], ['russia', 'RU'], ['china', 'CN'], ['кнр', 'CN'], ['usa', 'US'], ['south korea', 'KR']]) regionNames.set(name!, code!)
export const countryCode = (value: unknown): string => {
  const name = isObject(value) ? first(value.country_code, value.country) : text(value)
  return regionNames.get(normalizeText(name)) || ''
}
export const countryName = (value: unknown) => { const code = countryCode(value); return code ? new Intl.DisplayNames(['ru'], { type: 'region' }).of(code) || code : text(value) }
export const addressCountry = (value: unknown) => {
  if (countryCode(value)) return countryCode(value)
  const address = isObject(value) ? first(value.legal_address, value.address) : text(value)
  for (const part of address.split(/[,;/]/).reverse()) if (countryCode(part)) return countryCode(part)
  return ''
}
export const items = (doc: unknown): Record<string, unknown>[] => { const list = get(doc, 'items') || get(doc, 'goods') || get(doc, 'products'); return Array.isArray(list) ? list.filter(isObject) : [] }
export const skuKey = (value: unknown) => normalizeText(text(value)).replace(/[…–—]/g, '-').replace(/[^\p{L}\p{N}]/gu, '')
const containsSku = (description: unknown, sku: unknown) => {
  const needle = text(sku).normalize('NFKC').replace(/[–—]/g, '-').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return !!needle && new RegExp(`(?<![\\p{L}\\p{N}])${needle}(?![\\p{L}\\p{N}])`, 'iu').test(text(description).normalize('NFKC').replace(/[–—]/g, '-'))
}
export const matchingItems = (list: Record<string, unknown>[], item: Record<string, unknown>) => {
  const sku = skuKey(item.model_or_sku)
  const description = skuKey(item.description)
  return list.filter(candidate => {
    const other = skuKey(candidate.model_or_sku)
    if (sku && other) return sku === other
    if (sku && containsSku(candidate.description, item.model_or_sku)) return true
    if (other && containsSku(item.description, candidate.model_or_sku)) return true
    return !!description && description === skuKey(candidate.description)
  })
}
export const setPath = (source: Record<string, unknown>, path: string, value: unknown) => {
  const keys = path.split('.')
  let current: Record<string, unknown> = source
  keys.slice(0, -1).forEach((key, i) => {
    if (!isObject(current[key]) && !Array.isArray(current[key])) current[key] = /^\d+$/.test(keys[i + 1]!) ? [] : {}
    current = current[key] as Record<string, unknown>
  })
  current[keys.at(-1)!] = value
}
