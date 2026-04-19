const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export function getAttributionFromWindow() {
  if (!import.meta.client) {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      referrer: null,
      landing_path: null
    }
  }

  const params = new URLSearchParams(window.location.search)

  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    referrer: document.referrer || null,
    landing_path: `${window.location.pathname}${window.location.search}`
  }
}

export function buildTargetUrl(baseUrl: string) {
  if (!import.meta.client) {
    return baseUrl
  }

  const target = new URL(baseUrl, window.location.origin)
  const current = new URLSearchParams(window.location.search)

  UTM_KEYS.forEach((key) => {
    const value = current.get(key)
    if (value) {
      target.searchParams.set(key, value)
    }
  })

  return target.toString()
}
