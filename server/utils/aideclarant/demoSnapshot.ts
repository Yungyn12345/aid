import { createHash } from 'node:crypto'
import type { AnalyzeResult } from './types'

export type FixedDemoPayload = AnalyzeResult & { demoFiles: Array<{ name: string; extension: string; size: number }> }
export type DemoSnapshot = { version: string; frozenAt: string; provenance: string; checksum: string; payload: FixedDemoPayload }
const canonicalJson = (value: unknown): string => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(',')}}`
export const demoChecksum = (payload: unknown) => createHash('sha256').update(canonicalJson(payload)).digest('hex')
export const validateDemoSnapshot = (value: unknown): DemoSnapshot => {
  const snapshot = value as DemoSnapshot | null
  if (!snapshot?.version || !snapshot.checksum || !snapshot.payload || snapshot.payload.declarationDraft?.schemaVersion !== '2' || !Array.isArray(snapshot.payload.rows) || !snapshot.payload.tnved || !['agreement', 'invoice', 'packingList', 'cmr'].every(key => snapshot.payload.documents?.[key as keyof typeof snapshot.payload.documents])) throw new Error('Сохранённая демо-выдача отсутствует или имеет неверную структуру.')
  if (demoChecksum(snapshot.payload) !== snapshot.checksum) throw new Error('Контрольная сумма демо-выдачи не совпадает. Требуется восстановить сохранённую версию.')
  return snapshot
}
export const readFixedDemo = async () => {
  try {
    const stored = await useStorage('assets:server').getItem<DemoSnapshot>('aideclarant/demo/snapshot.json')
    const snapshot = validateDemoSnapshot(stored)
    return { ...structuredClone(snapshot.payload), demoVersion: snapshot.version, demoChecksum: snapshot.checksum, demoMode: 'fixed' as const, source: 'demo-cache' as const }
  } catch (error) {
    throw createError({ statusCode: 503, statusMessage: 'Saved demo unavailable', message: error instanceof Error ? error.message : 'Сохранённая демо-выдача недоступна.' })
  }
}
