// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/styles/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru'
      },
      title: 'AIDDoc | АИ Декларант',
      meta: [
        {
          name: 'description',
          content:
            'Промо-сайт AIDDoc: автоматизация подготовки деклараций, заявка на консультацию и быстрый переход в сервис АИ Декларант.'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'AIDDoc | АИ Декларант' },
        {
          property: 'og:description',
          content:
            'Автоматизируйте подготовку деклараций и сопроводительных документов с помощью AIDDoc.'
        },
        { property: 'og:image', content: '/og-cover.svg' },
        { property: 'og:locale', content: 'ru_RU' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: process.env.NUXT_PUBLIC_SITE_URL || 'https://aiddoc.ru/' }
      ]
    }
  },
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://localhost:8001/api/v1',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://aiddoc.ru',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api/v1',
      ctaUrl: process.env.NUXT_PUBLIC_CTA_URL || 'https://aiddoc.ru/aideclarant',
      yandexMetrikaId: process.env.NUXT_PUBLIC_YANDEX_METRIKA_ID || '',
      googleTagId: process.env.NUXT_PUBLIC_GOOGLE_TAG_ID || ''
    }
  },
  future: {
    compatibilityVersion: 4
  }
})
