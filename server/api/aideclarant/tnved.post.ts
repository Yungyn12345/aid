import { suggestTnvedCodes } from '../../utils/aideclarant/tnved'
import type { ExtractedDocuments } from '../../utils/aideclarant/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    documents?: ExtractedDocuments
    goodsText?: string
  }>(event)

  return await suggestTnvedCodes({
    documents: body.documents,
    goodsText: body.goodsText,
  })
})
