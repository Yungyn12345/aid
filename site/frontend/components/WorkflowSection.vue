<script setup lang="ts">
import type { StepItem } from '~/types/landing'

defineProps<{
  id?: string
  steps: StepItem[]
}>()
</script>

<template>
  <section :id="id" class="shell py-12 md:py-16">
    <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <RevealBlock class="glass-card rounded-[32px] p-6 md:p-8">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-accent/80">Архитектура</p>
        <h2 class="section-title mt-4">Разделенный лендинг, который не ломает основной продукт.</h2>
        <p class="mt-6 section-copy">
          Frontend на Nuxt 3 отвечает за SEO и адаптивную подачу. Backend на FastAPI принимает
          публичные события и admin-запросы. Reverse proxy отдает `/`, `/api` и `/aideclarant`
          по разным upstream без смешивания кодовых баз.
        </p>
      </RevealBlock>

      <div class="space-y-4">
        <RevealBlock
          v-for="(step, index) in steps"
          :key="step.title"
          :delay="index * 120"
          class="glass-card rounded-[28px] p-6 md:p-8"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start">
            <div class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 font-display text-lg text-accent">
              0{{ index + 1 }}
            </div>
            <div>
              <h3 class="text-2xl font-semibold text-cream">{{ step.title }}</h3>
              <p class="mt-3 text-base leading-7 text-mist/76">{{ step.description }}</p>
            </div>
          </div>
        </RevealBlock>
      </div>
    </div>
  </section>
</template>
