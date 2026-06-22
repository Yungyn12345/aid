import { createRequire } from 'node:module'
import { callGigaChatJson } from './gigachat'
import { getExtractionPrompt } from './prompts'
import type { DocumentType } from './types'

const nodeRequire = createRequire(import.meta.url)

const normalizeFileName = (name: string) => name.toLowerCase()

export const getFileExtension = (name: string) => {
  const extension = name.split('.').pop()
  return extension ? extension.toLowerCase() : ''
}

export const detectDocumentTypeByName = (fileName: string): DocumentType | null => {
  const name = normalizeFileName(fileName)

  if (/cmr|цмр/.test(name)) {
    return 'cmr'
  }

  if (/packing|pack|pl-|pl_|упаков|упак/.test(name)) {
    return 'packingList'
  }

  if (/invoice|inv|инвойс|счет|сч[её]т/.test(name)) {
    return 'invoice'
  }

  if (/contract|agreement|договор|контракт|ved-dogovor/.test(name)) {
    return 'agreement'
  }

  return null
}

export const extractTextFromFile = async (buffer: Buffer, fileName: string) => {
  const extension = getFileExtension(fileName)

  if (extension === 'pdf') {
    const pdfParseModule = nodeRequire('pdf-parse') as {
      default?: (dataBuffer: Buffer) => Promise<{ text?: string }>
    } | ((dataBuffer: Buffer) => Promise<{ text?: string }>)

    const pdfParse = typeof pdfParseModule === 'function'
      ? pdfParseModule
      : pdfParseModule.default

    if (!pdfParse) {
      throw new Error('Не удалось загрузить pdf-parse')
    }

    const result = await pdfParse(buffer)

    return String(result.text || '').trim()
  }

  if (extension === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })

    return String(result.value || '').trim()
  }

  if (extension === 'xlsx') {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    return workbook.SheetNames.map((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName]

      if (!sheet) {
        return `Лист: ${sheetName}\n`
      }

      const csv = XLSX.utils.sheet_to_csv(sheet)
      return `Лист: ${sheetName}\n${csv}`
    }).join('\n\n').trim()
  }

  if (extension === 'doc') {
    throw new Error('DOC — старый бинарный формат. Для серверного чтения нужен LibreOffice/antiword. Сейчас загрузи DOCX или PDF.')
  }

  throw new Error(`Неподдерживаемый формат файла: ${extension}`)
}

export const extractDocumentWithAi = async (documentType: DocumentType, text: string) => {
  if (!text.trim()) {
    throw new Error('Не удалось извлечь текст из документа. Возможно, это скан без текстового слоя.')
  }

  return await callGigaChatJson<Record<string, unknown>>({
    system: 'Ты извлекаешь структурированные данные из ВЭД-документов для подготовки декларации на товары. Возвращай только валидный JSON.',
    prompt: getExtractionPrompt(documentType, text),
    modelType: 'docs',
  })
}
