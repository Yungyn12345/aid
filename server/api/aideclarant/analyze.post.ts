import { buildComparisonRowsFromDocuments } from '../../utils/aideclarant/comparison'
import { buildDeclarationDraftFromDocuments } from '../../utils/aideclarant/declaration'
import { runAiCrossCheck } from '../../utils/aideclarant/crosscheck'
import { detectDocumentTypeByName, extractDocumentWithAi, extractTextFromFile } from '../../utils/aideclarant/extract'
import type { AnalyzeResult, ExtractedDocuments } from '../../utils/aideclarant/types'

export default defineEventHandler(async (event): Promise<AnalyzeResult> => {
  const parts = await readMultipartFormData(event)

  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No files uploaded',
    })
  }

  const documents: ExtractedDocuments = {}
  const errors: string[] = []

  for (const part of parts) {
    if (!part.filename || !part.data?.length) {
      continue
    }

    const documentType = detectDocumentTypeByName(part.filename)

    if (!documentType) {
      errors.push(`${part.filename}: не удалось определить тип документа по имени файла`)
      continue
    }

    try {
      const text = await extractTextFromFile(Buffer.from(part.data), part.filename)
      documents[documentType] = await extractDocumentWithAi(documentType, text)
    } catch (error) {
      errors.push(`${part.filename}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  const rawRows = buildComparisonRowsFromDocuments(documents)
  const crossCheck = await runAiCrossCheck(rawRows)
  const declarationDraft = buildDeclarationDraftFromDocuments(documents)

  return {
    documents,
    declarationDraft,
    errors,
    ...crossCheck,
  }
})
