<script setup lang="ts">
import type { FeatureItem } from '~/types/landing'

withDefaults(
  defineProps<{
    id?: string
    title: string
    eyebrow?: string
    accent?: string
    items: FeatureItem[]
  }>(),
  {
    id: undefined,
    eyebrow: 'Ключевой блок',
    accent: ''
  }
)
</script>

<template>
  <section :id="id" class="shell py-12 md:py-16">
    <RevealBlock class="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-accent/80">
          {{ eyebrow }}
        </p>
        <h2 class="section-title max-w-3xl">{{ title }}</h2>
      </div>
      <p v-if="accent" class="section-copy">{{ accent }}</p>
    </RevealBlock>

    <div class="grid gap-4 lg:grid-cols-3">
      <RevealBlock
        v-for="(item, index) in items"
        :key="item.title"
        :delay="index * 90"
        class="glass-card h-full rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/35"
      >
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-coral">{{ item.tag }}</p>
        <h3 class="mt-6 text-2xl font-semibold leading-tight text-cream">{{ item.title }}</h3>
        <p class="mt-4 text-base leading-7 text-mist/75">{{ item.description }}</p>
      </RevealBlock>
    </div>
  </section>
</template>
