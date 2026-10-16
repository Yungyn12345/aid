import { describe, expect, test } from 'bun:test'
import { readFixedDemo } from '../server/utils/aideclarant/demoSnapshot'

describe('fixed demo storage, failure and request isolation', () => {
  test('parallel requests return the same version and independent mutable copies', async () => {
    const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
    const globals = globalThis as any
    const previous = { useStorage: globals.useStorage, createError: globals.createError }
    globals.useStorage = () => ({ getItem: async () => snapshot })
    globals.createError = (value: any) => Object.assign(new Error(value.message), value)
    try {
      const replies = await Promise.all(Array.from({ length: 24 }, () => readFixedDemo()))
      expect(new Set(replies.map(reply => reply.demoChecksum)).size).toBe(1)
      expect(new Set(replies.map(reply => reply.demoVersion)).size).toBe(1)
      replies[0]!.declarationDraft['g2-name'] = 'user override'
      replies[0]!.rows[0]!.values[0] = 'user override'
      const clean = await readFixedDemo()
      expect(clean.declarationDraft['g2-name']).toBe(snapshot.payload.declarationDraft['g2-name'])
      expect(clean.rows[0]!.values[0]).toBe(snapshot.payload.rows[0].values[0])
      expect(replies[1]!.declarationDraft['g2-name']).not.toBe('user override')
      expect(clean.source).toBe('demo-cache')
      expect(clean.demoMode).toBe('fixed')
    } finally { Object.assign(globals, previous) }
  })
  test('missing, corrupted or unreadable storage fails explicitly without regeneration', async () => {
    const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
    const globals = globalThis as any
    const previous = { useStorage: globals.useStorage, createError: globals.createError }
    globals.createError = (value: any) => Object.assign(new Error(value.message), value)
    try {
      for (const stored of [null, { ...snapshot, checksum: 'invalid' }]) {
        globals.useStorage = () => ({ getItem: async () => stored })
        await expect(readFixedDemo()).rejects.toMatchObject({ statusCode: 503 })
      }
      globals.useStorage = () => ({ getItem: async () => { throw new Error('storage unavailable') } })
      await expect(readFixedDemo()).rejects.toMatchObject({ statusCode: 503 })
    } finally { Object.assign(globals, previous) }
  })
  test('the reviewed snapshot retains both control-panel pallets and actual source dates', async () => {
    const snapshot = await Bun.file('server/assets/aideclarant/demo/snapshot.json').json()
    const draft = snapshot.payload.declarationDraft
    expect(draft.goodsCount).toBe('3')
    expect(draft['goods.2.g35-gross']).toBe('490')
    expect(draft['goods.2.g38-net']).toBe('420')
    expect(draft['goods.2.g42-amount']).toBe('1720')
    expect(draft['g22-sum']).toBe('7470')
    expect(draft['g8-inn']).toBe('7705123456/770501001')
    expect(snapshot.payload.documents.cmr.net_weight_total_kg).toBeUndefined()
    expect(snapshot.payload.documents.cmr.related_documents.every((ref: any) => !ref.date)).toBeTrue()
    expect(snapshot.payload.rows.filter((row: any) => row.status === 'mismatch')).toHaveLength(0)
    expect(snapshot.payload.rows.filter((row: any) => row.id.startsWith('internal.') && row.cellChecks.some((s: string) => s === 'empty' || s === 'mismatch'))).toHaveLength(0)
    expect(snapshot.provenance).toContain('manually checked')
    expect(draft['goods.0.g45-cval']).toBe('')
    expect(draft['goods.0.g46-statistical']).toBe('')
  })
})
