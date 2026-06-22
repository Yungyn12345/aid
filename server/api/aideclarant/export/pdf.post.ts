import { resolve } from 'node:path'
import { createError, readBody, setHeader } from 'h3'
import { compileTypstPdf } from '../../../utils/typst/compile'
import { buildTypstDeclarationData } from '../../../utils/aideclarant/typstDeclaration'
import type { DeclarationDraft } from '../../../utils/aideclarant/types'

type ExportPdfRequestBody = {
  declarationDraft?: DeclarationDraft
  filename?: string
}

const sanitizePdfFileName = (value: string) => {
  const cleaned = value
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return cleaned || 'declaration'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ExportPdfRequestBody>(event).catch((): ExportPdfRequestBody => ({}))

  if (!body.declarationDraft || typeof body.declarationDraft !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Declaration draft is required',
    })
  }

  const templatePath = resolve(process.cwd(), 'server/templates/aideclarant/declaration.typ')
  const pdfFileName = `${sanitizePdfFileName(body.filename || 'declaration')}.pdf`
  const typstData = buildTypstDeclarationData(body.declarationDraft)

  try {
    const pdf = await compileTypstPdf({
      templatePath,
      outputName: pdfFileName,
      data: typstData,
    })

    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${pdfFileName}"`)
    setHeader(event, 'Cache-Control', 'no-store')

    return pdf
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Typst PDF export failed'

    throw createError({
      statusCode: 500,
      statusMessage: 'Typst PDF export failed',
      message,
    })
  }
})
