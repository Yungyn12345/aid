import { diagnoseGigaChatConnection } from '../../../utils/aideclarant/gigachat'

export default defineEventHandler(async () => {
  const connection = await diagnoseGigaChatConnection()

  return {
    ok: connection.connected,
    source: connection.connected ? 'gigachat' : 'local-fallback',
    connection,
  }
})
