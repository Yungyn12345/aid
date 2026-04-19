export function sendAnalyticsEvent(name: string, params: Record<string, unknown> = {}) {
  if (!import.meta.client) {
    return
  }

  const config = useRuntimeConfig()

  if (typeof window.ym === 'function' && config.public.yandexMetrikaId) {
    window.ym(Number(config.public.yandexMetrikaId), 'reachGoal', name, params)
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}
