import { callGigaChatJsonControlled, getGigaChatErrorMeta } from './gigachat'
import type { ExtractedDocuments, TnvedSuggestion, TnvedSuggestionResult } from './types'

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

const text = (value: unknown) => {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return JSON.stringify(value)
}

const collectGoodsContext = (documents?: ExtractedDocuments, goodsText?: string) => {
  const invoiceItems = get(documents?.invoice, 'items')
  const packingItems = get(documents?.packingList, 'items')
  const agreementSubject = text(get(documents?.agreement, 'subject'))
  const plNotes = text(get(documents?.packingList, 'notes'))

  return [
    goodsText ? `Поле 31 ДТ:\n${goodsText}` : '',
    agreementSubject ? `Предмет договора:\n${agreementSubject}` : '',
    Array.isArray(invoiceItems) ? `Позиции инвойса:\n${JSON.stringify(invoiceItems, null, 2)}` : '',
    Array.isArray(packingItems) ? `Позиции упаковочного листа:\n${JSON.stringify(packingItems, null, 2)}` : '',
    plNotes ? `Примечания PL:\n${plNotes}` : '',
  ].filter(Boolean).join('\n\n')
}

const normalizeSuggestions = (suggestions: unknown): TnvedSuggestion[] => {
  if (!Array.isArray(suggestions)) {
    return []
  }

  return suggestions
    .filter(isObject)
    .map((item) => ({
      code: text(item.code || item.eaeu_hs_code || item.tnved_code || item.tn_ved_code).replace(/\D/g, '').slice(0, 10),
      title: text(item.title || item.name || item.description || 'Рекомендованный код'),
      confidence: Math.max(0, Math.min(1, Number(item.confidence || 0.5))),
      reason: text(item.reason || item.explanation || item.notes || 'Код подобран по описанию товара из документов.'),
      source: text(item.source || 'GigaChat'),
    }))
    .filter((item) => item.code.length >= 4)
    .slice(0, 5)
}

const localFallbackTnved = (): TnvedSuggestionResult => ({
  source: 'local-fallback',
  summary: 'Показаны резервные рекомендации по описанию демо-товаров. Финальный код должен проверить специалист.',
  suggestions: [
    {
      code: '8422909000',
      title: 'Части оборудования для упаковки или обёртывания товаров',
      confidence: 0.68,
      reason: 'В документах указаны spare parts for packaging machines / запасные части к упаковочному оборудованию. Это базовый кандидат для основной группы товаров.',
      source: 'local-fallback',
    },
    {
      code: '8537109800',
      title: 'Пульты, панели и основания для электрического управления',
      confidence: 0.48,
      reason: 'В составе партии есть control panel GM-CP-450. Для этой позиции может потребоваться отдельная классификация, если она декларируется отдельно.',
      source: 'local-fallback',
    },
    {
      code: '8412310009',
      title: 'Пневматические силовые установки линейного действия / прочие',
      confidence: 0.42,
      reason: 'В составе партии есть pneumatic unit GM-PN-U20. Код примерный: нужна проверка характеристик узла и назначения.',
      source: 'local-fallback',
    },
  ],
})

export const suggestTnvedCodes = async (params: {
  documents?: ExtractedDocuments
  goodsText?: string
}): Promise<TnvedSuggestionResult> => {
  const context = collectGoodsContext(params.documents, params.goodsText)

  if (!context.trim()) {
    return {
      source: 'local-fallback',
      summary: 'Недостаточно описания товара для подбора кода ТН ВЭД.',
      suggestions: [],
    }
  }

  try {
    const { data: response, meta } = await callGigaChatJsonControlled<{ summary?: string; suggestions?: unknown }>({
      system: 'Ты эксперт по предварительной классификации товаров по ТН ВЭД ЕАЭС. Возвращай только валидный JSON.',
      modelType: 'tnved',
      prompt: `
Подбери предварительные варианты кодов ТН ВЭД ЕАЭС по данным из документов.

Важно:
- Не утверждай, что код финальный.
- Не выдумывай сведения, которых нет в описании.
- Если товаров несколько и они могут классифицироваться отдельно, верни несколько кандидатов.
- confidence от 0 до 1.
- code должен быть строкой, желательно 10 цифр.
- Без markdown. Только JSON.

Верни структуру:
{
  "summary": "краткое предупреждение/итог",
  "suggestions": [
    {
      "code": "10 цифр или максимально точный код",
      "title": "название товарной позиции",
      "confidence": 0.7,
      "reason": "почему этот код подходит",
      "source": "GigaChat"
    }
  ]
}

Контекст товара:
${context.slice(0, 60_000)}
`,
    })

    const suggestions = normalizeSuggestions(response.suggestions)

    if (!suggestions.length) {
      return localFallbackTnved()
    }

    return {
      source: 'gigachat',
      summary: response.summary || 'Коды подобраны предварительно. Финальную классификацию должен проверить специалист.',
      suggestions,
      aiConnection: meta,
    }
  } catch (error) {
    const meta = getGigaChatErrorMeta(error)
    const fallback = localFallbackTnved()

    return {
      ...fallback,
      summary: `${fallback.summary} GigaChat недоступен: ${meta.error || 'unknown error'}${meta.cause ? ` (${meta.cause})` : ''}`,
      aiConnection: {
        ...meta,
        usedFallback: true,
      },
    }
  }
}
