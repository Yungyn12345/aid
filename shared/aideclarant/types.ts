export type DocumentType = 'agreement' | 'invoice' | 'packingList' | 'cmr'

export const documentOrder: DocumentType[] = ['agreement', 'invoice', 'packingList', 'cmr']

export const documentLabels: Record<DocumentType, string> = {
  agreement: 'Контракт',
  invoice: 'Инвойс',
  packingList: 'Упаковочный лист',
  cmr: 'CMR',
}

export type ExtractedDocuments = Partial<Record<DocumentType, Record<string, unknown>>>

export type ComparisonCellStatus = 'ok' | 'similar' | 'mismatch' | 'empty' | 'unchecked' | 'ignored'
export type ComparisonRowStatus = 'ok' | 'similar' | 'mismatch' | 'empty' | 'unchecked' | 'ignored'

export type ComparisonRow = {
  id?: string
  attribute: string
  values: string[]
  kind?: 'text' | 'entity' | 'address' | 'identifier' | 'country' | 'number' | 'weight' | 'volume' | 'currency' | 'date' | 'reference' | 'incoterms' | 'goods' | 'route'
  sku?: string
  bindings?: Array<{ document: DocumentType; paths: string[]; numeric?: boolean; format?: 'entity' | 'incoterms' | 'reference' | 'goods'; linePaths?: string[][] } | null>
  components?: ComparisonRow[]
  draftEntity?: 'g2' | 'g8'
  draftKeys?: string[]
  applicable?: boolean[]
  preferredColumn?: number
  absenceReasons?: Array<'missing-document' | 'not-applicable' | 'missing-value' | 'unrecognized' | null>
  cellNotes?: string[]
  // Derived consistency rows are recomputed from documents, never edited as facts.
  cellChecks?: ComparisonCellStatus[]
  cellStatuses?: ComparisonCellStatus[]
  status?: ComparisonRowStatus
  issue?: string
  recommendation?: string
}

export type DeclarationDraft = Record<string, string>

export type AiProviderSource = 'gigachat' | 'local-fallback' | 'local' | 'demo-cache'

export type AiConnectionState = {
  provider: 'gigachat'
  connected: boolean
  usedFallback: boolean
  checkedAt: string
  durationMs: number
  stage: 'not-started' | 'oauth' | 'chat' | 'parse' | 'done'
  model?: string
  modelsTried?: string[]
  requestId?: string
  httpStatus?: number
  error?: string
  cause?: string
  authUrl?: string
  baseUrl?: string
  usedCaBundle: boolean
  caBundleFile?: string
  verifySsl: boolean
}

export type TnvedSuggestion = {
  code: string
  title: string
  confidence: number
  reason: string
  source?: string
}

export type TnvedSuggestionResult = {
  suggestions: TnvedSuggestion[]
  summary: string
  source: AiProviderSource
  aiConnection?: AiConnectionState
}

export type CrossCheckResult = {
  rows: ComparisonRow[]
  summary: string
  source: AiProviderSource
  aiConnection?: AiConnectionState
}

export type AnalyzeResult = CrossCheckResult & {
  documents: ExtractedDocuments
  declarationDraft: DeclarationDraft
  errors: string[]
  demoMode?: 'ai' | 'fixture' | 'fixture-fallback' | 'fixed'
  demoVersion?: string
  demoChecksum?: string
  tnved?: TnvedSuggestionResult
}
