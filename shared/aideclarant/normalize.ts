import { isObject, items, numberValue, text, volumeM3 } from './data'
import type { ExtractedDocuments } from './types'
export const parseIncotermsValue = (value: string) => ({ rule: value.match(/^\s*([A-Za-z]{3})\b/)?.[1]?.toUpperCase() || '', place: value.replace(/^\s*[A-Za-z]{3}\s*/, '').replace(/\s*\(?Incoterms[®\s]*\d{4}\)?\s*/i, '').trim(), version: value.match(/Incoterms[®\s]*(\d{4})/i)?.[1] || '' })

// Accept equivalent extraction shapes without guessing missing facts.
const reference = (value: unknown) => {
  if (typeof value !== 'string') return value
  const date = value.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/)
  return {
    number: value.replace(/\s+от\s+.*$/iu, '').replace(/^(?:договор|контракт|contract|invoice|инвойс|packing\s+list)\s*(?:№|No\.?|#)?\s*/iu, '').trim(),
    date: date ? `${date[3]}-${date[2]}-${date[1]}` : '',
  }
}
export const normalizeDocuments = (input: ExtractedDocuments): ExtractedDocuments => {
  // Browser state can be a Vue proxy, so clone the JSON document rather than the proxy.
  const documents = JSON.parse(JSON.stringify(input)) as ExtractedDocuments
  for (const doc of Object.values(documents)) {
    if (!doc) continue
    for (const key of ['contract_reference', 'invoice_ref']) if (typeof doc[key] === 'string') doc[key] = reference(doc[key])
    for (const role of ['seller', 'buyer', 'shipper', 'consignor', 'consignee', 'declarant']) {
      const party = doc[role]
      if (!isObject(party)) continue
      if (!party.vat_or_tax_id && party.vat_id) party.vat_or_tax_id = party.vat_id
      const inn = text(party.id).match(/ИНН\s*(\d{10}|\d{12})\b/iu)
      const vat = text(party.id).match(/VAT\s*([A-Z]{2}[A-Z0-9]+)/i)
      if (!party.inn && inn) party.inn = inn[1]
      if (!party.vat_or_tax_id && vat) party.vat_or_tax_id = vat[1]
    }
    // Keep unit prices separate; a missing line total remains visible to checks.
    for (const item of items(doc)) if (!item.model_or_sku) {
      const sku = text(item.description).match(/\b[A-Z]{2,}[\w]*-[A-Z0-9]+(?:-[A-Z0-9]+)*(?:(?:\.{3}|…)[A-Z0-9]+)?\b/)
      if (sku) item.model_or_sku = sku[0]
    }
  }
  const packing = documents.packingList
  if (packing && typeof packing.packages === 'string') packing.packages = { total_packages: numberValue(packing.packages), marks_and_numbers: packing.marks_and_numbers }
  if (packing && typeof packing.dimensions_total === 'string' && volumeM3(packing.dimensions_total) !== null) packing.dimensions_total = { volume_m3: volumeM3(packing.dimensions_total) }
  const cmr = documents.cmr
  if (cmr && typeof cmr.packages_summary === 'string') cmr.packages_summary = { number_of_packages: numberValue(cmr.packages_summary), description: cmr.packages_summary }
  if (cmr && typeof cmr.place_and_date_taking_over === 'string') {
    const value = cmr.place_and_date_taking_over
    const date = reference(value) as { date: string }
    cmr.place_and_date_taking_over = { place: value.replace(/\s*[—–-]?\s*\d{2}\.\d{2}\.\d{4}\s*$/, ''), date: date.date }
  }
  if (cmr && Array.isArray(cmr.related_documents)) cmr.related_documents = cmr.related_documents.map(value => typeof value === 'string' ? { ...reference(value) as object, type: /packing|упаков/i.test(value) ? 'Packing List' : /contract|договор|контракт/i.test(value) ? 'Contract' : /invoice|инвойс/i.test(value) ? 'Invoice' : '' } : value)
  return documents
}
