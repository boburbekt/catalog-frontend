# Mebel Catalog Web

Ko‘p ijarali (multi-tenant) mebel katalogi uchun frontend.

- Nuxt 4 + Vue 3 + TypeScript
- Mobil-birinchi katalog, mahsulot sahifasi, buyurtma formasi va demo admin sahifasi
- Keyinchalik shu URL Telegram Mini App ichida ochiladi
- Backend alohida repoda: [catalog-backend](https://github.com/boburbekt/catalog-backend)

## 1. Ishga tushirish

Avval backend'ni ishga tushiring ([catalog-backend](https://github.com/boburbekt/catalog-backend) repo, `docker compose up --build`), so‘ng:

```bash
npm install
cp .env.example .env     # ixtiyoriy — default `http://localhost:8000/api`
npm run dev
```

Brauzer:

- Demo katalog: http://localhost:3000/demo-mebel
- Mahsulot sahifasi: http://localhost:3000/demo-mebel/product/milan-divan
- Admin mahsulotlar: http://localhost:3000/admin

`/` avtomatik `/demo-mebel` ga yo‘naltiradi.

## 2. Skriptlar

```bash
npm run dev        # dev server
npm run build      # production build
npm run preview    # build'ni lokal ko‘rish
npm run typecheck  # vue-tsc
```

## 3. Muhit o‘zgaruvchilari

| O‘zgaruvchi | Default | Izoh |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8000/api` | Backend API manzili |
| `NUXT_PUBLIC_MEDIA_BASE` | `http://localhost:8000` | Rasm/media manzili (`/uploads/...`) |
| `NUXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public saytning absolute manzili (canonical, OG, sitemap, robots) |

So‘rovlar ikki composable orqali ketadi: `usePublicApi()` (token yubormaydi) va `useAdminApi()`
(faqat admin so‘rovlarga `X-Admin-Token`). URL'larni kodga qattiq yozmang.

## 4. Typelar va helperlar

Backend javob typelari **yagona manbada**: `app/types/api.ts` (`Business`, `Category`, `Product`,
`Catalog`, `Order`, `OrderItem`, `OrderList`, `Stats`). Sahifalar bu typelarni takrorlamasdan import
qiladi. OpenAPI codegen ishlatilmaydi — backend sxemasi o‘zgarsa shu fayl qo‘lda yangilanadi.

Formatlash helperlari (Nuxt avtomatik import): `app/composables/format.ts` (`money`,
`availabilityLabel`, `orderStatusLabel`) va `app/composables/useMedia.ts` (`resolveMediaUrl`).

## 5. SEO

- `server/routes/sitemap.xml.ts` — backend `/api/public/sitemap` dan absolute URL'li XML quradi.
- `server/routes/robots.txt.ts` — `/admin` ni `Disallow` qiladi va `Sitemap:` ni ko‘rsatadi.
- Public sahifalarda `canonical`, Open Graph va Twitter card meta teglari bor.
- Admin sahifalarida `noindex, nofollow`.

## 6. Sahifalar

| Route | Fayl | Render |
| --- | --- | --- |
| `/:shopSlug` | `app/pages/[shopSlug]/index.vue` | SSR |
| `/:shopSlug/product/:productSlug` | `app/pages/[shopSlug]/product/[productSlug].vue` | SSR |
| `/admin`, `/admin/orders`, `/admin/categories`, `/admin/settings` | `app/pages/admin/*.vue` | client-only (`routeRules`) |

Katalog sahifasida qidiruv (300–500 ms debounce) va kategoriya filtri serverda bajariladi.

## 5. Docker

`Dockerfile` deploy uchun mavjud. Frontend'ni konteynerda, backend'ni hostda ishlatganda `NUXT_PUBLIC_API_BASE` bitta qiymat bilan ikkalasiga to‘g‘ri kelmaydi (SSR konteyner ichidan, brauzer esa hostdan chaqiradi), shuning uchun lokal ishlab chiqishda `npm run dev` tavsiya etiladi.

## 6. Keyingi ishlar

- Admin autentifikatsiyasi
- Rasm yuklash
- Mijoz kabineti
- Telegram Mini App `initData` validatsiyasi
