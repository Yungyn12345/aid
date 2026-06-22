declare module 'pdf-parse' {
  import type { Buffer } from 'node:buffer'

  export type PdfParseResult = {
    text?: string
    numpages?: number
    numrender?: number
    info?: unknown
    metadata?: unknown
    version?: string
  }

  export default function pdfParse(dataBuffer: Buffer | Uint8Array): Promise<PdfParseResult>
}
