export type DocumentType = 'agreement' | 'invoice' | 'packingList' | 'cmr'

export const documentOrder: DocumentType[] = ['agreement', 'invoice', 'packingList', 'cmr']

export const documentLabels: Record<DocumentType, string> = {
  agreement: 'Контракт',
  invoice: 'Инвойс',
  packingList: 'Упаковочный лист',
  cmr: 'CMR',
}

export type ExtractedDocuments = Partial<Record<DocumentType, Record<string, unknown>>>

export type ComparisonCellStatus = 'ok' | 'mismatch' | 'empty' | 'unchecked' | 'ignored'
export type ComparisonRowStatus = 'ok' | 'mismatch' | 'empty' | 'unchecked' | 'ignored'

export type ComparisonRow = {
  attribute: string
  values: string[]
  cellStatuses?: ComparisonCellStatus[]
  status?: ComparisonRowStatus
  issue?: string
  recommendation?: string
}

export type DeclarationDraft = Record<string, string>

export type AiProviderSource = 'gigachat' | 'local-fallback'

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
  demoMode?: 'ai' | 'fixture' | 'fixture-fallback'
}
