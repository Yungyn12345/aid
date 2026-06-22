import { documentLabels, documentOrder, type ComparisonRow, type DocumentType } from './types'

export const getExtractionPrompt = (documentType: DocumentType, text: string) => {
  const label = documentLabels[documentType]

  const mapping = `
Ты извлекаешь данные из документа для подготовки декларации на товары и сквозной сверки документов.
Это перенос логики из старого проекта AI Declarant: извлечение реквизитов договора, инвойса, упаковочного листа и CMR для граф ДТ.

Верни строго валидный JSON без markdown и комментариев. Не выдумывай значения. Если поля нет — не добавляй его или оставь пустую строку.

Базовые правила:
- seller / buyer / consignor / consignee — имена, адреса, страны, идентификаторы.
- incoterms — объект { "rule", "place", "version" }.
- currency — объект { "code" }.
- items — массив товаров: description, model_or_sku, quantity, uom, origin_country, manufacturer, gross_weight_kg, net_weight_kg.
- даты возвращай в YYYY-MM-DD, если можешь уверенно определить.
- числа возвращай числами, не строками.

Документ: ${label}.
`

  const documentSpecific: Record<DocumentType, string> = {
    agreement: `
Для договора ищи: contract_number, contract_date, seller, buyer, subject, incoterms, currency, payment_terms, transport_terms, appendices, origin_and_manufacturer, packaging_and_marking_requirements, compliance_documents, catalog_references, cross_links.
`,
    invoice: `
Для инвойса ищи: invoice_number, invoice_date, seller, buyer, incoterms, currency, total_amount, subtotal_ex_vat, vat_amount, grand_total, charges, contract_reference, payment_terms, bank_details, items.
`,
    packingList: `
Для упаковочного листа ищи: pl_number, pl_date, invoice_ref, packages, gross_weight_total, net_weight_total, dimensions_total, items, packaging, marks_and_numbers, origin_country, manufacturer.
`,
    cmr: `
Для CMR ищи: consignor, consignee, place_and_date_taking_over, place_of_delivery, packages_summary, gross_weight_total_kg, net_weight_total_kg, transport, carrier, route_countries, cmr_number, cmr_date, related_documents, items.
`,
  }

  return `${mapping}\n${documentSpecific[documentType]}\nТекст документа:\n${text.slice(0, 120_000)}`
}

export const getCrossCheckPrompt = (rows: ComparisonRow[]) => {
  return `
Ты выполняешь ИИ-кросс-проверку документов для таможенной декларации.
На входе таблица, где колонки строго в порядке: ${documentOrder.map((key) => documentLabels[key]).join(', ')}.

Критически важные правила статусов:
1. Прочерк "—", пустая строка и явно отсутствующие данные в ДЕМО-таблице не являются ошибкой. Для таких ячеек ставь статус "ignored".
2. Не помечай прочерки красным. Они означают, что в этом типе документа поле обычно отсутствует.
3. Сравнивай только заполненные ячейки внутри строки.
4. Если заполненные значения совпадают по смыслу — ставь "ok".
5. Если заполненное значение реально противоречит другим заполненным значениям — ставь "mismatch" только проблемной ячейке.
6. Если строка дополняющая, значения могут быть разными и это нормально. Для строк "Маршрут", "Описание товара", "Дата отгрузки / принятия груза перевозчиком" не требуй посимвольного совпадения, оценивай отсутствие конфликта.
7. Не возвращай общие фразы про пустые значения. Не пиши "Есть пустые значения...".
8. Если проблем нет — summary: "ИИ-проверка не выявила критичных расхождений.".

Статусы:
- "ok" — значение заполнено и согласовано;
- "mismatch" — значение заполнено, но конфликтует с другими документами;
- "ignored" — поле отсутствует / стоит прочерк и это допустимо;
- "empty" — используй только если значение обязательно должно быть в конкретном документе, но отсутствует. Для текущих демо-прочерков не используй.

Верни строго JSON без markdown:
{
  "summary": "краткий итог проверки",
  "rows": [
    {
      "attribute": "точное имя строки из входа",
      "status": "ok" | "mismatch" | "empty" | "ignored",
      "cellStatuses": ["ok" | "mismatch" | "empty" | "ignored", "ok" | "mismatch" | "empty" | "ignored", "ok" | "mismatch" | "empty" | "ignored", "ok" | "mismatch" | "empty" | "ignored"],
      "issue": "только конкретная проблема, если есть реальный конфликт",
      "recommendation": "короткая рекомендация, если есть реальный конфликт"
    }
  ]
}

Входные строки:
${JSON.stringify(rows, null, 2)}
`
}
