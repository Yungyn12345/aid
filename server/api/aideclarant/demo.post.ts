import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildComparisonRowsFromDocuments } from '../../utils/aideclarant/comparison'
import { buildDeclarationDraftFromDocuments } from '../../utils/aideclarant/declaration'
import { runAiCrossCheck } from '../../utils/aideclarant/crosscheck'
import { extractDocumentWithAi, extractTextFromFile } from '../../utils/aideclarant/extract'
import type { DocumentType, ExtractedDocuments } from '../../utils/aideclarant/types'

const demoFiles: Array<{
  type: DocumentType
  assetName: string
  fileName: string
  extension: string
  size: number
}> = [
  {
    type: 'agreement',
    assetName: 'agreement',
    fileName: 'ved-dogovor_TI-GM-2025-012.pdf',
    extension: 'PDF',
    size: 420_000,
  },
  {
    type: 'invoice',
    assetName: 'invoice',
    fileName: 'invoice_GM-INV-2025-384.pdf',
    extension: 'PDF',
    size: 260_000,
  },
  {
    type: 'packingList',
    assetName: 'pl',
    fileName: 'packing_list_PL-2025-384.pdf',
    extension: 'PDF',
    size: 310_000,
  },
  {
    type: 'cmr',
    assetName: 'cmr',
    fileName: 'CMR.pdf',
    extension: 'PDF',
    size: 190_000,
  },
]

const readJsonAsset = async (name: string) => {
  const data = await useStorage('assets:server').getItem<Record<string, unknown>>(`aideclarant/demo/${name}.json`)

  if (!data) {
    throw createError({
      statusCode: 500,
      statusMessage: `Demo asset ${name}.json not found`,
    })
  }

  return data
}

const readFixtureDocuments = async (): Promise<ExtractedDocuments> => ({
  agreement: await readJsonAsset('agreement'),
  invoice: await readJsonAsset('invoice'),
  packingList: await readJsonAsset('pl'),
  cmr: await readJsonAsset('cmr'),
})

const readDemoPdfDocumentsWithAi = async () => {
  const documents: ExtractedDocuments = {}
  const errors: string[] = []

  for (const file of demoFiles) {
    try {
      const filePath = resolve(process.cwd(), 'public/aideclarant/demo', file.fileName)
      const buffer = await readFile(filePath)
      const text = await extractTextFromFile(buffer, file.fileName)
      documents[file.type] = await extractDocumentWithAi(file.type, text)
    } catch (error) {
      errors.push(`${file.fileName}: ${error instanceof Error ? error.message : 'unknown error'}`)
      throw new Error(errors.join('\n'))
    }
  }

  return { documents, errors }
}

type DemoRequestBody = {
  mode?: 'ai' | 'fixture'
  allowFixtureFallback?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<DemoRequestBody>(event).catch((): DemoRequestBody => ({}))

  const mode: 'ai' | 'fixture' = body.mode ?? 'ai'
  const allowFixtureFallback = body.allowFixtureFallback !== false
  const errors: string[] = []
  let documents: ExtractedDocuments
  let demoMode: 'ai' | 'fixture' | 'fixture-fallback' = mode === 'fixture' ? 'fixture' : 'ai'

  if (mode === 'fixture') { 
    documents = await readFixtureDocuments()
  } else {
    try {
      const result = await readDemoPdfDocumentsWithAi()
      documents = result.documents
      errors.push(...result.errors)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'

      if (!allowFixtureFallback) {
        throw createError({
          statusCode: 502,
          statusMessage: `Demo AI extraction failed: ${message}`,
        })
      }

      demoMode = 'fixture-fallback'
      errors.push(`Демо PDF не удалось считать через GigaChat. Использованы готовые JSON-фикстуры. Причина: ${message}`)
      documents = await readFixtureDocuments()
    }
  }

  const rawRows = buildComparisonRowsFromDocuments(documents)
  const crossCheck = await runAiCrossCheck(rawRows)
  const declarationDraft = buildDeclarationDraftFromDocuments(documents)

  return {
    documents,
    declarationDraft,
    ...crossCheck,
    errors,
    demoMode,
    demoFiles: demoFiles.map(({ fileName, extension, size }) => ({
      name: fileName,
      extension,
      size,
    })),
  }
})
