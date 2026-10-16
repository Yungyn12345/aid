import { suggestTnvedCodes } from '../../utils/aideclarant/tnved'
import type { ExtractedDocuments } from '../../utils/aideclarant/types'
import { readFixedDemo } from '../../utils/aideclarant/demoSnapshot'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    documents?: ExtractedDocuments
    goodsText?: string
    demoVersion?: string
    allowAi?: boolean
  }>(event)

  if (body.demoVersion) {
    const demo = await readFixedDemo()
    if (body.demoVersion !== demo.demoVersion) throw createError({ statusCode: 409, statusMessage: 'Demo version changed' })
    return demo.tnved
  }
  if (body.allowAi === false) throw createError({ statusCode: 400, statusMessage: 'Explicit AI analysis required for changed data' })
  return await suggestTnvedCodes({
    documents: body.documents,
    goodsText: body.goodsText,
  })
})
