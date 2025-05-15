// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint'
  ],

  css: [
    '~/assets/css/main.css',
    'leaflet/dist/leaflet.css'
  ],

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-11-27',

  // Add server middleware configuration
  serverHandlers: [
    { route: '/api/**', handler: '~/server/middleware/api.ts' }
  ]
})
