export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // SSR ichidagi so'rovlar uchun ichki manzil (prodda http://backend:8000/api).
    // Bo'sh bo'lsa public.apiBase ishlatiladi — lokal dev shu holatda qoladi.
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
      mediaBase: process.env.NUXT_PUBLIC_MEDIA_BASE || 'http://localhost:8000',
      // Public sahifalarning absolute manzili (canonical, OG, sitemap, robots uchun).
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'uz' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#181612' }
      ],
      link: [
        // Font Awesome 6 (free) — admin paneldagi ikonkalar uchun. CDN CSS, hisob talab qilmaydi.
        { rel: 'preconnect', href: 'https://cdnjs.cloudflare.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
          crossorigin: 'anonymous',
          referrerpolicy: 'no-referrer'
        }
      ]
    }
  },
  routeRules: {
    '/admin/**': { ssr: false }
  }
})
