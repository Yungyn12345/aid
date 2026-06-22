import { applyCrossCheckResult, localCrossCheckRows, summarizeCrossCheckRows } from './comparison'
import { getCrossCheckPrompt } from './prompts'
import type { ComparisonRow, CrossCheckResult } from './types'
import { callGigaChatJsonControlled, getGigaChatErrorMeta } from './gigachat'

type GigaCrossCheckResponse = {
  summary?: string
  rows?: Array<Partial<ComparisonRow> & { attribute: string }>
}

export const runAiCrossCheck = async (rows: ComparisonRow[]): Promise<CrossCheckResult> => {
  try {
    const { data: aiResult, meta } = await callGigaChatJsonControlled<GigaCrossCheckResponse>({
      system: 'Ты эксперт по таможенным документам, ВЭД и проверке данных для декларации на товары. Возвращай только валидный JSON.',
      prompt: getCrossCheckPrompt(rows),
      modelType: 'docs',
    })

    if (!Array.isArray(aiResult.rows)) {
      throw new Error('GigaChat crosscheck response rows is not an array')
    }

    const checkedRows = applyCrossCheckResult(rows, aiResult.rows as ComparisonRow[])

    return {
      rows: checkedRows,
      summary: aiResult.summary || summarizeCrossCheckRows(checkedRows),
      source: 'gigachat',
      aiConnection: meta,
    }
  } catch (error) {
    const meta = getGigaChatErrorMeta(error)
    const fallback = localCrossCheckRows(rows)

    return {
      ...fallback,
      summary: `${fallback.summary} GigaChat недоступен: ${meta.error || 'unknown error'}${meta.cause ? ` (${meta.cause})` : ''}`,
      source: 'local-fallback',
      aiConnection: {
        ...meta,
        usedFallback: true,
      },
    }
  }
}
