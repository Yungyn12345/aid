// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'


export default defineNuxtConfig({
  compatibilityDate: '2026-06-21',

  app: {
    head: {
      title: 'AI Doc',
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
        },
      ],
      meta: [
        {
          name: 'theme-color',
          content: '#1B2E4C',
        },
      ],
    },
  },


  runtimeConfig: {
    gigachatAuthKey: process.env.GIGACHAT_AUTH_KEY || '',
    gigachatAuthUrl: process.env.GIGACHAT_AUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
    gigachatBaseUrl: process.env.GIGACHAT_BASE_URL || 'https://gigachat.devices.sberbank.ru/api/v1',
    gigachatScope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
    gigachatModelDocs: process.env.GIGACHAT_MODEL_DOCS || 'GigaChat-2',
    gigachatModelTnved: process.env.GIGACHAT_MODEL_TNVED || 'GigaChat-2',
    gigachatModelDocsFallbacks: process.env.GIGACHAT_MODEL_DOCS_FALLBACKS || 'GigaChat-Pro,GigaChat-Max',
    gigachatModelTnvedFallbacks: process.env.GIGACHAT_MODEL_TNVED_FALLBACKS || 'GigaChat-Pro,GigaChat-Max',
    gigachatCaBundleFile: process.env.GIGACHAT_CA_BUNDLE_FILE || './certs/russian_trusted_root_ca_pem.crt',
    gigachatVerifySsl: process.env.GIGACHAT_VERIFY_SSL || 'true',
    gigachatDebug: process.env.GIGACHAT_DEBUG || 'true',
  },

  devtools: {
    enabled: true,
  },

  modules: [
    '@pinia/nuxt',
  ],

  css: [
    '~/assets/css/main.css',
  ],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  typescript: {
    typeCheck: true,
  },
})