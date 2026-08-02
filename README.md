# Mebel Catalog Web

![Nuxt](https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&logo=nuxtdotjs&logoColor=white) ![Vue](https://img.shields.io/badge/Vue_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

Mobile-first storefront and admin panel for a multi-tenant furniture catalog. Server-rendered public pages for SEO, client-only admin area, designed to run inside a Telegram Mini App.

**Highlights**
- ⚡ SSR catalog and product pages with canonical / OG / Twitter meta
- 🔎 Server-side search (debounced) and category filtering
- 🗺️ Dynamic sitemap.xml and robots.txt generated from the API
- 🔐 Split API layer — usePublicApi() vs useAdminApi() (token never leaks to public calls)
- 🧩 Single source of truth for API types in app/types/api.ts

**Backend:** [catalog-backend](https://github.com/boburbekt/catalog-backend)

## 1. Getting started

Start the backend first ([catalog-backend](https://github.com/boburbekt/catalog-backend) repo, docker compose up --build), then:

```bash
npm install
cp .env.example .env     # optional — defaults to http://localhost:8000/api
npm run dev
```

In the browser:

- Demo catalog: http://localhost:3000/demo-mebel
- Product page: http://localhost:3000/demo-mebel/product/milan-divan
- Admin products: http://localhost:3000/admin

/ redirects to /demo-mebel automatically.

## 2. Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run preview    # preview the build locally
npm run typecheck  # vue-tsc
```

## 3. Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| NUXT_PUBLIC_API_BASE | http://localhost:8000/api | Backend API address |
| NUXT_PUBLIC_MEDIA_BASE | http://localhost:8000 | Image / media address (/uploads/...) |
| NUXT_PUBLIC_SITE_URL | http://localhost:3000 | Absolute address of the public site (canonical, OG, sitemap, robots) |

Requests go through two composables: usePublicApi() (never sends a token) and useAdminApi() (attaches X-Admin-Token to admin requests only). Do not hardcode URLs.

## 4. Types and helpers

Backend response types live in a **single source of truth**: app/types/api.ts (Business, Category, Product, Catalog, Order, OrderItem, OrderList, Stats). Pages import these types instead of redeclaring them. No OpenAPI codegen is used — when the backend schema changes, this file is updated by hand.

Formatting helpers (auto-imported by Nuxt): app/composables/format.ts (money, availabilityLabel, orderStatusLabel) and app/composables/useMedia.ts (resolveMediaUrl).

## 5. SEO

- server/routes/sitemap.xml.ts — builds XML with absolute URLs from the backend /api/public/sitemap endpoint.
- server/routes/robots.txt.ts — disallows /admin and points to Sitemap:.
- Public pages include canonical, Open Graph and Twitter card meta tags.
- Admin pages are marked noindex, nofollow.

## 6. Pages

| Route | File | Rendering |
| --- | --- | --- |
| /:shopSlug | app/pages/[shopSlug]/index.vue | SSR |
| /:shopSlug/product/:productSlug | app/pages/[shopSlug]/product/[productSlug].vue | SSR |
| /admin, /admin/orders, /admin/categories, /admin/settings | app/pages/admin/*.vue | client-only (routeRules) |

On the catalog page, search (300–500 ms debounce) and category filtering are performed server-side.

## 7. Docker

A Dockerfile is provided for deployment. When the frontend runs in a container while the backend runs on the host, a single NUXT_PUBLIC_API_BASE value cannot satisfy both (SSR calls from inside the container, the browser calls from the host), so npm run dev is recommended for local development.

## 8. Roadmap

- Admin authentication
- Image upload
- Customer account area
- Telegram Mini App initData validation
