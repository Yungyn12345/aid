<script setup lang="ts">
import {
  benefits,
  faqs,
  footerLinks,
  metrics,
  painPoints,
  processSteps
} from '~/utils/landing-content'
import { sendAnalyticsEvent } from '~/utils/analytics'

const config = useRuntimeConfig()

useSeoMeta({
  title: 'AIDDoc | АИ Декларант',
  description:
    'Промо-сайт AIDDoc с описанием продукта, формой заявки и быстрым переходом в сервис АИ Декларант.',
  ogTitle: 'AIDDoc | АИ Декларант',
  ogDescription:
    'Автоматизация подготовки деклараций и сопроводительных документов для ВЭД-команд.',
  ogImage: `${config.public.siteUrl}/og-cover.svg`,
  twitterCard: 'summary_large_image'
})

onMounted(() => {
  sendAnalyticsEvent('page_view', { page: 'landing' })
})
</script>

<template>
  <div>
    <SiteHeader />
    <main>
      <HeroSection :metrics="metrics" />
      <FeatureGrid id="problems" title="Что тормозит команду" :items="painPoints" />
      <WorkflowSection id="workflow" :steps="processSteps" />
      <FeatureGrid
        id="benefits"
        title="Что получает бизнес"
        eyebrow="Результат"
        accent="Переход от ручной рутины к управляемому процессу"
        :items="benefits" 
      />
      <LeadSection id="contact" :faqs="faqs" />
    </main>
    <SiteFooter :links="footerLinks" />
  </div>
</template>
