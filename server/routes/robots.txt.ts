/**
 * robots.txt: admin bo‘limini indekslashni taqiqlaydi va sitemap manzilini ko‘rsatadi.
 * Sitemap manzili `NUXT_PUBLIC_SITE_URL` asosida absolute bo‘ladi.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

  const body = [
    'User-agent: *',
    'Disallow: /admin',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return body
})
