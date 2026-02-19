import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    preset: 'vercel',
  },

  modules: ['@pinia/nuxt'],

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? '',
  },
})
