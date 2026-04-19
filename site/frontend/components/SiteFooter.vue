<script setup lang="ts">
import type { FooterLink } from '~/types/landing'

defineProps<{
  links: FooterLink[]
}>()
</script>

<template>
  <footer class="shell pb-10 pt-6">
    <div class="glass-card flex flex-col gap-6 rounded-[32px] px-6 py-8 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="font-display text-xl uppercase tracking-[0.18em] text-cream">AIDDoc</p>
        <p class="mt-2 max-w-xl text-sm leading-6 text-mist/70">
          Отдельный лендинг для продукта АИ Декларант с настраиваемым CTA, логированием событий и готовой инфраструктурой под отдельный деплой.
        </p>
      </div>

      <div class="flex flex-wrap gap-4 text-sm text-mist/70">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.href"
          class="rounded-full border border-white/10 px-4 py-2 transition hover:border-accent/40 hover:text-cream"
        >
          {{ link.label }}
        </a>
      </div>
    </div>
  </footer>
</template>
