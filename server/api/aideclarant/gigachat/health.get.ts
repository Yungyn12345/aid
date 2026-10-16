// A page load or health probe must not create a chat completion.
export default defineEventHandler(() => {
  const configured = Boolean(useRuntimeConfig().gigachatAuthKey)
  return { ok: configured, configured, source: 'local', status: configured ? 'configured' : 'not-configured' }
})
