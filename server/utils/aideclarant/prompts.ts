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
1. Прочерк "—", пустая строка и явно отсутствующие данные НЕ всегда являются нормой.
2. Пустая ячейка получает "ignored" только если поле допустимо отсутствует в конкретном типе документа.
3. Пустая ячейка получает "empty", если поле обязательно для конкретного типа документа.
4. Сравнивай только заполненные ячейки внутри строки, но обязательные пустые ячейки всё равно помечай "empty".
5. Если заполненные значения совпадают по смыслу и по сути — ставь "ok".
6. Если значения не идентичны, но явно описывают близкую/дополняющую информацию без прямого конфликта — ставь "similar". Пример: "страна назначения Россия, происхождение Германия" и "DE → PL → BY → RU".
7. Если заполненное значение реально противоречит другим заполненным значениям — ставь "mismatch" только проблемной ячейке.
8. Даты проверяй строго. Разница даже в 1 день — это не "ok".
9. Не возвращай общие фразы про пустые значения. Пиши только конкретную проблему.
10. Если проблем нет — summary: "ИИ-проверка не выявила критичных расхождений.".

Допустимо пустые поля по типам документов:
- CMR: "Номер договора", "Номер инвойса", "Валюта".
- Инвойс: "Дата отгрузки / принятия груза перевозчиком", "Общее количество мест", "Общий вес брутто, кг", "Общий объём, м³", "Номер договора / инвойса в маркировке", "Маршрут".
- Контракт: "Дата отгрузки / принятия груза перевозчиком", "Общее количество мест", "Общий вес брутто, кг", "Общий объём, м³", "Номер договора / инвойса в маркировке".
- Упаковочный лист: "Маршрут", "Условия поставки (Incoterms)", "Валюта".

Статусы:
- "ok" — значение заполнено и согласовано;
- "similar" — значение заполнено, похоже/связано по смыслу, но требует ручной проверки;
- "mismatch" — значение заполнено, но конфликтует с другими документами;
- "ignored" — поле отсутствует / стоит прочерк и это допустимо для данного типа документа;
- "empty" — обязательное для данного типа документа значение отсутствует.

Верни строго JSON без markdown:
{
  "summary": "краткий итог проверки",
  "rows": [
    {
      "attribute": "точное имя строки из входа",
      "status": "ok" | "similar" | "mismatch" | "empty" | "ignored",
      "cellStatuses": ["ok" | "similar" | "mismatch" | "empty" | "ignored", "ok" | "similar" | "mismatch" | "empty" | "ignored", "ok" | "similar" | "mismatch" | "empty" | "ignored", "ok" | "similar" | "mismatch" | "empty" | "ignored"],
      "issue": "только конкретная проблема, если есть реальный конфликт или обязательное пустое поле",
      "recommendation": "короткая рекомендация, если есть реальная проблема"
    }
  ]
}

Входные строки:
${JSON.stringify(rows, null, 2)}
`
}
