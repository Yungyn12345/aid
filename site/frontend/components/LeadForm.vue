<script setup lang="ts">
import { sendAnalyticsEvent } from '~/utils/analytics'
import { getAttributionFromWindow } from '~/utils/url'

const { submitLead } = useLandingApi()

const form = reactive({
  name: '',
  company: '',
  contact: '',
  message: '',
  website: ''
})

const state = reactive({
  pending: false,
  success: '',
  error: ''
})

async function handleSubmit() {
  state.success = ''
  state.error = ''
  state.pending = true

  try {
    const attribution = getAttributionFromWindow()

    const response = await submitLead({
      ...form,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      referrer: attribution.referrer,
      landing_path: attribution.landing_path
    })

    sendAnalyticsEvent('lead_submit', { id: response.id })

    state.success = 'Заявка отправлена. Мы свяжемся с вами после обработки.'
    form.name = ''
    form.company = ''
    form.contact = ''
    form.message = ''
    form.website = ''
  } catch {
    state.error = 'Не удалось отправить форму. Повторите попытку позже.'
    sendAnalyticsEvent('lead_error', { section: 'contact_form' })
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <form class="glass-card rounded-[32px] p-6 md:p-8" @submit.prevent="handleSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="flex flex-col gap-2">
        <span class="text-sm text-mist/76">Имя</span>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="120"
          class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-cream outline-none transition focus:border-accent/60"
          placeholder="Иван"
        >
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-sm text-mist/76">Компания</span>
        <input
          v-model="form.company"
          type="text"
          maxlength="180"
          class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-cream outline-none transition focus:border-accent/60"
          placeholder="ООО Ромашка"
        >
      </label>
    </div>

    <label class="mt-4 flex flex-col gap-2">
      <span class="text-sm text-mist/76">Телефон или email</span>
      <input
        v-model="form.contact"
        type="text"
        required
        maxlength="180"
        class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-cream outline-none transition focus:border-accent/60"
        placeholder="+7 (999) 123-45-67 / mail@example.com"
      >
    </label>

    <label class="mt-4 flex flex-col gap-2">
      <span class="text-sm text-mist/76">Комментарий</span>
      <textarea
        v-model="form.message"
        rows="5"
        maxlength="2000"
        class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-cream outline-none transition focus:border-accent/60"
        placeholder="Опишите задачу или желаемый сценарий запуска."
      />
    </label>

    <input v-model="form.website" type="text" tabindex="-1" autocomplete="off" class="hidden">

    <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-full border border-line bg-cream px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition hover:-translate-y-0.5 hover:border-accent hover:shadow-glow disabled:opacity-60"
        :disabled="state.pending"
      >
        {{ state.pending ? 'Отправка...' : 'Отправить заявку' }}
      </button>
      <p class="text-xs leading-5 text-mist/55">
        Отправляя форму, пользователь передает только данные, нужные для обратной связи и аналитики.
      </p>
    </div>

    <p v-if="state.success" class="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
      {{ state.success }}
    </p>
    <p v-if="state.error" class="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
      {{ state.error }}
    </p>
  </form>
</template>
