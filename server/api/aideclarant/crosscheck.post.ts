import { runAiCrossCheck } from '../../utils/aideclarant/crosscheck'
import type { ComparisonRow } from '../../utils/aideclarant/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ rows?: ComparisonRow[] }>(event)

  if (!Array.isArray(body.rows)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'rows must be an array',
    })
  }

  return await runAiCrossCheck(body.rows)
})
