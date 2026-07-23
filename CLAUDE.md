# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for a multi-tenant furniture catalog MVP ("Mebel Catalog"): Nuxt 4 + Vue 3 + TypeScript, mobile-first, intended to later be opened inside a Telegram Mini App. All UI strings are in Uzbek. The FastAPI backend lives in a separate repository (`catalog-backend`) and must be running for any page to render.

## Commands

```bash
npm install
npm run dev        # nuxt dev on :3000
npm run build
npm run preview
npm run typecheck  # vue-tsc — the only static check in the repo
```

There are no tests and no linter configured.

## Architecture

Nuxt 4 srcDir layout: application code lives under `app/`, not the project root.

**Tenant comes from the URL.** Routes are file-based: `pages/[shopSlug]/index.vue` (catalog), `pages/[shopSlug]/product/[productSlug].vue` (detail + order form), `pages/admin/index.vue`. `pages/index.vue` just `navigateTo('/demo-mebel')`. The backend resolves the shop by that slug, so `shopSlug` must be threaded into every API path.

**All HTTP goes through `useApi()`** (`app/composables/useApi.ts`), a `$fetch` instance bound to `runtimeConfig.public.apiBase` (`NUXT_PUBLIC_API_BASE`, default `http://localhost:8000/api`). Never call `$fetch`/`useFetch` with a hardcoded URL.

Catalog and product pages fetch with `useAsyncData` and are SSR'd; the catalog passes `watch: [category, search]` so filtering re-queries the server rather than filtering client-side. `/admin/**` is client-only via `routeRules` in `nuxt.config.ts`.

**Response types are hand-written `interface`s declared locally in each page** — they duplicate the backend's Pydantic schemas in `catalog-backend/app/schemas/catalog.py`. There is no codegen and no shared package, so a backend schema change silently breaks types here; update both repos together. Prices arrive as decimal **strings** and are rendered with `Intl.NumberFormat('uz-UZ')`.

Styling is plain CSS: global tokens in `app/assets/css/main.css` plus scoped `<style>` blocks per component. No UI or CSS framework.

The admin page posts to the backend's unauthenticated demo admin API with a hardcoded `business_slug: 'demo-mebel'`, and derives `slug` from the product name via a `watch` on `form.name`.
