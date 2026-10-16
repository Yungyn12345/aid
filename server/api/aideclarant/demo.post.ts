import { readFixedDemo } from '../../utils/aideclarant/demoSnapshot'

// Every caller receives the same approved snapshot, including old mode=ai callers.
// This route has no dependency on extraction or any AI client.
export default defineEventHandler(async (event) => {
  const demo = await readFixedDemo()
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'ETag', `"${demo.demoChecksum}"`)
  setHeader(event, 'X-Demo-Version', demo.demoVersion)
  return demo
})
