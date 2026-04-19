<script setup lang="ts">
import type { MetricItem } from '~/types/landing'

defineProps<{
  metrics: MetricItem[]
}>()
</script>

<template>
  <section class="shell pb-16 pt-10 md:pb-24 md:pt-16">
    <div class="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
      <RevealBlock class="glass-card overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        <p class="mb-6 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Промо-сайт + отдельный API + PostgreSQL
        </p>
        <h1 class="max-w-3xl font-display text-4xl leading-[1.08] text-cream sm:text-5xl lg:text-6xl">
          AIDDoc переводит подготовку декларации из ручной рутины в управляемый цифровой поток.
        </h1>
        <p class="mt-6 max-w-2xl text-base leading-7 text-mist/78 sm:text-lg">
          Лендинг ведет пользователя в сервис АИ Декларант, фиксирует источники переходов,
          принимает заявки и остается полностью изолированным от основного продукта.
        </p>
        <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <CtaButton source="hero" :large="true" />
          <a
            href="#contact"
            class="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-mist/90 transition hover:border-accent/40 hover:text-cream"
          >
            Оставить заявку
          </a>
        </div>
      </RevealBlock>

      <RevealBlock class="grid gap-4" :delay="120">
        <div class="glass-card relative overflow-hidden p-6">
          <div class="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-coral/10 to-transparent" />
          <div class="absolute inset-y-0 left-24 w-14 bg-accent/8" />
          <div class="relative rounded-[24px] border border-line bg-inkSoft p-6 shadow-glow">
            <div class="mb-5 flex items-center justify-between">
              <span class="text-xs uppercase tracking-[0.18em] text-mist/60">Сценарий запуска</span>
              <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-mist/65">aid / макет</span>
            </div>
            <div class="rounded-full border border-line bg-cream px-6 py-4 text-center font-body text-base font-extrabold uppercase tracking-[0.06em] text-black sm:text-lg">
              Заполнить декларацию
            </div>
            <div class="mt-6 grid gap-3 text-sm text-mist/70">
              <div class="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <span>CTA URL</span>
                <span class="text-cream">через env</span>
              </div>
              <div class="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <span>Логи кликов</span>
                <span class="text-cream">backend / postgres</span>
              </div>
              <div class="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <span>Роут продукта</span>
                <span class="text-cream">/aideclarant</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div
            v-for="metric in metrics"
            :key="metric.label"
            class="glass-card rounded-[24px] px-5 py-6"
          >
            <p class="text-2xl font-display text-cream">{{ metric.value }}</p>
            <p class="mt-2 text-sm leading-6 text-mist/72">{{ metric.label }}</p>
          </div>
        </div>
      </RevealBlock>
    </div>
  </section>
</template>
