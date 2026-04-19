import type { CtaClickPayload, LeadPayload } from '~/types/landing'

export function useLandingApi() {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl

  async function submitLead(payload: LeadPayload) {
    return await $fetch<{ success: boolean; id: number }>(`${apiBaseUrl}/leads`, {
      method: 'POST',
      body: payload
    })
  }

  async function trackCtaClick(payload: CtaClickPayload) {
    if (!import.meta.client) {
      return
    }

    const url = `${apiBaseUrl}/events/cta-click`
    const body = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      const beacon = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, beacon)
      return
    }

    await $fetch(url, {
      method: 'POST',
      body: payload
    }).catch(() => undefined)
  }

  return {
    submitLead,
    trackCtaClick
  }
}
