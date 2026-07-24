/**
 * Dinamik sitemap: backend `/api/public/sitemap` dan faol do‘kon va ko‘rinadigan mahsulot
 * slug'larini oladi, absolute URL'lar bilan XML quradi.
 *
 * Absolute manzil `NUXT_PUBLIC_SITE_URL` dan olinadi. Barcha qiymatlar XML-escape qilinadi.
 */
interface SitemapShop { slug: string, updated_at: string }
interface SitemapProduct { shop_slug: string, slug: string, updated_at: string }
interface SitemapResponse { shops: SitemapShop[], products: SitemapProduct[] }

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiBase = (config.public.apiBase as string).replace(/\/$/, '')
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

  const urls: { loc: string, lastmod: string }[] = []
  try {
    const data = await $fetch<SitemapResponse>(`${apiBase}/public/sitemap`)
    for (const shop of data.shops) {
      urls.push({ loc: `${siteUrl}/${shop.slug}`, lastmod: shop.updated_at })
    }
    for (const product of data.products) {
      urls.push({
        loc: `${siteUrl}/${product.shop_slug}/product/${product.slug}`,
        lastmod: product.updated_at
      })
    }
  } catch {
    // Backend yetib bo‘lmasa — bo‘sh, lekin yaroqli sitemap qaytadi.
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${xmlEscape(u.loc)}</loc><lastmod>${xmlEscape(u.lastmod)}</lastmod></url>`
      )
      .join('\n') +
    '\n</urlset>\n'

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return body
})
