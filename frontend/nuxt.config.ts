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
      desktopAppDownloadUrl: process.env.NUXT_PUBLIC_DESKTOP_APP_DOWNLOAD_URL || '#',
      // Waitlist mode - when true, disables auth/dashboard and shows waitlist only
      waitlistMode: false,
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
      title: 'Columbus - Free AI Engine Optimization Platform',
      titleTemplate: '%s | Columbus',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'The only completely free AEO platform with 100% authentic data and full ToS compliance. Track your visibility in ChatGPT, Claude, Gemini, and Perplexity.' },
        { name: 'theme-color', content: '#F29901' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'author', content: 'Columbus' },
        { name: 'keywords', content: 'AEO, AI engine optimization, ChatGPT visibility, Claude visibility, Gemini visibility, Perplexity, AI search optimization, brand monitoring' },
        // Open Graph
        { property: 'og:site_name', content: 'Columbus' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Columbus - Free AI Engine Optimization Platform' },
        { property: 'og:description', content: 'The only completely free AEO platform with 100% authentic data and full ToS compliance. Track your visibility in ChatGPT, Claude, Gemini, and Perplexity.' },
        { property: 'og:image', content: 'https://columbus-aeo.com/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Columbus - Free AI Engine Optimization Platform' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:url', content: 'https://columbus-aeo.com' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@EmilioBuildin' },
        { name: 'twitter:creator', content: '@EmilioBuildin' },
        { name: 'twitter:title', content: 'Columbus - Free AI Engine Optimization Platform' },
        { name: 'twitter:description', content: 'The only completely free AEO platform with 100% authentic data and full ToS compliance.' },
        { name: 'twitter:image', content: 'https://columbus-aeo.com/og-image.png' },
        { name: 'twitter:image:alt', content: 'Columbus - Free AI Engine Optimization Platform' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

})
