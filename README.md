# Mebel Catalog Web

![Nuxt](https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&logo=nuxtdotjs&logoColor=white)
![Vue](https://img.shields.io/badge/Vue_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

Mobile-first storefront and admin panel for a multi-tenant furniture catalog. Server-rendered public pages for SEO, client-only admin area, designed to run inside a Telegram Mini App.

**Highlights**
- ⚡ SSR catalog and product pages with canonical / OG / Twitter meta
- 🔎 Server-side search (debounced) and category filtering
- 🗺️ Dynamic sitemap.xml and robots.txt generated from the API
- 🔐 Split API layer — usePublicApi() vs useAdminApi() (token never leaks to public calls)
- 🧩 Single source of truth for API types in app/types/api.ts

**Backend:** [catalog-backend](https://github.com/boburbekt/catalog-backend)

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

## 7. Docker

`Dockerfile` deploy uchun mavjud. Frontend'ni konteynerda, backend'ni hostda ishlatganda `NUXT_PUBLIC_API_BASE` bitta qiymat bilan ikkalasiga to‘g‘ri kelmaydi (SSR konteyner ichidan, brauzer esa hostdan chaqiradi), shuning uchun lokal ishlab chiqishda `npm run dev` tavsiya etiladi.

## 8. Keyingi ishlar

- Admin autentifikatsiyasi
- Rasm yuklash
- Mijoz kabineti
- Telegram Mini App `initData` validatsiyasi
