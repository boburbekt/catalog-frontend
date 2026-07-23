# Mebel Catalog Web

Ko‘p ijarali (multi-tenant) mebel katalogi uchun frontend.

- Nuxt 4 + Vue 3 + TypeScript
- Mobil-birinchi katalog, mahsulot sahifasi, buyurtma formasi va demo admin sahifasi
- Keyinchalik shu URL Telegram Mini App ichida ochiladi
- Backend alohida repoda: `catalog-backend`

## 1. Ishga tushirish

Avval backend'ni ishga tushiring (`catalog-backend` repo, `docker compose up --build`), so‘ng:

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

Barcha so‘rovlar `useApi()` composable orqali ketadi — u shu qiymatga bog‘langan `$fetch` nusxasini qaytaradi. URL'larni kodga qattiq yozmang.

## 4. Sahifalar

| Route | Fayl | Render |
| --- | --- | --- |
| `/:shopSlug` | `app/pages/[shopSlug]/index.vue` | SSR |
| `/:shopSlug/product/:productSlug` | `app/pages/[shopSlug]/product/[productSlug].vue` | SSR |
| `/admin` | `app/pages/admin/index.vue` | client-only (`routeRules`) |

Katalog sahifasida qidiruv va kategoriya filtri serverda bajariladi — `useAsyncData` `category` va `search` o‘zgarganda qayta so‘rov yuboradi.

## 5. Docker

`Dockerfile` deploy uchun mavjud. Frontend'ni konteynerda, backend'ni hostda ishlatganda `NUXT_PUBLIC_API_BASE` bitta qiymat bilan ikkalasiga to‘g‘ri kelmaydi (SSR konteyner ichidan, brauzer esa hostdan chaqiradi), shuning uchun lokal ishlab chiqishda `npm run dev` tavsiya etiladi.

## 6. Keyingi ishlar

- Admin autentifikatsiyasi
- Rasm yuklash
- Mijoz kabineti
- Telegram Mini App `initData` validatsiyasi
