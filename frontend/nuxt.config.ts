// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  devtools: { enabled: true },

  // Use SSG/SPA mode - no server routes needed
  ssr: false,

  nitro: {
    preset: 'static',
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      include: ['/dashboard(/*)?'],
      exclude: ['/', '/auth/*'],
    },
  },

  runtimeConfig: {
    // Public keys (exposed to client)
    // Note: @nuxtjs/supabase module automatically exposes SUPABASE_URL and SUPABASE_KEY
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      workerApiUrl: process.env.WORKER_API_URL || 'http://localhost:3001',
    },
  },

  typescript: {
    strict: false,
    typeCheck: false, // Disable during dev - re-enable before production build
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  app: {
    head: {
      title: 'Columbus - AI Engine Optimization Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Optimize your visibility in AI chatbots like ChatGPT, Claude, and Gemini. Get actionable recommendations to improve your AEO.'
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ],
    },
  },

})
