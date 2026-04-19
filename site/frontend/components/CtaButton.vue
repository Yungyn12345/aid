<script setup lang="ts">
import { sendAnalyticsEvent } from '~/utils/analytics'
import { buildTargetUrl, getAttributionFromWindow } from '~/utils/url'

const props = withDefaults(
  defineProps<{
    source: string
    label?: string
    large?: boolean
  }>(),
  {
    label: 'Заполнить декларацию',
    large: false
  }
)

const pending = ref(false)
const config = useRuntimeConfig()
const { trackCtaClick } = useLandingApi()

async function handleClick() {
  if (pending.value) {
    return
  }

  pending.value = true
  const targetUrl = buildTargetUrl(config.public.ctaUrl)
  const attribution = getAttributionFromWindow()

  sendAnalyticsEvent('cta_click', { source: props.source })

  await trackCtaClick({
    source: props.source,
    target_url: targetUrl,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    referrer: attribution.referrer
  })

  window.location.assign(targetUrl)
}
</script>

<template>
  <button
    type="button"
    class="group inline-flex items-center justify-center rounded-full border border-line bg-cream px-6 py-3 text-center font-body text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70 sm:px-7"
    :class="props.large && 'min-w-[280px] py-4 text-base'"
    :disabled="pending"
    @click="handleClick"
  >
    <span>{{ props.label }}</span>
  </button>
</template>
