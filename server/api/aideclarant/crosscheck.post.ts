import { runAiCrossCheck } from '../../utils/aideclarant/crosscheck'
import type { ComparisonRow } from '../../utils/aideclarant/types'
import { localCrossCheckRows } from '../../utils/aideclarant/comparison'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ rows?: ComparisonRow[]; demoVersion?: string; allowAi?: boolean }>(event)

  if (!Array.isArray(body.rows)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'rows must be an array',
    })
  }

  return body.demoVersion || body.allowAi === false ? localCrossCheckRows(body.rows) : await runAiCrossCheck(body.rows)
})
