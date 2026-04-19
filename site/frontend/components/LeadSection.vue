<script setup lang="ts">
import type { FaqItem } from '~/types/landing'

defineProps<{
  id?: string
  faqs: FaqItem[]
}>()
</script>

<template>
  <section :id="id" class="shell py-12 md:py-16">
    <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <RevealBlock class="glass-card rounded-[32px] p-6 md:p-8">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-accent/80">Контакт</p>
        <h2 class="section-title mt-4">Оставьте заявку, если нужно обсудить внедрение или запуск отдельного сценария.</h2>
        <p class="mt-6 section-copy">
          Форма отправляет данные в отдельный backend, сохраняет источник обращения и не зависит от текущей кодовой базы продукта.
        </p>

        <div class="mt-8 space-y-4">
          <div
            v-for="faq in faqs"
            :key="faq.question"
            class="rounded-[24px] border border-white/10 bg-white/5 p-5"
          >
            <p class="font-semibold text-cream">{{ faq.question }}</p>
            <p class="mt-2 text-sm leading-6 text-mist/70">{{ faq.answer }}</p>
          </div>
        </div>
      </RevealBlock>

      <RevealBlock :delay="120">
        <LeadForm />
      </RevealBlock>
    </div>
  </section>
</template>
