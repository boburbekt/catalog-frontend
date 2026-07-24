<script setup lang="ts">
interface Category { id: number; name: string; slug: string }
interface Product {
  id: number; name: string; slug: string; price: string; old_price?: string | null
  image_url?: string | null; availability: string; category?: Category | null
}
interface Catalog {
  business: {
    name: string; slug: string; logo_url?: string | null; phone?: string | null
    telegram_username?: string | null; address?: string | null; description?: string | null
    categories: Category[]
  }
  products: Product[]
  total: number
  limit: number
  offset: number
}

const PAGE_SIZE = 24

const route = useRoute()
const api = usePublicApi()
const { resolveMediaUrl } = useMedia()
// `searchInput` — inputga bog‘langan; `search` — debounce'dan keyin serverga so‘rov uchun ishlatiladi.
const searchInput = ref('')
const search = ref('')
const category = ref('')
const limit = ref(PAGE_SIZE)
const shopSlug = computed(() => String(route.params.shopSlug))
// QR/reklama manbasi — mahsulot havolalari va tashrif eventida saqlanadi.
const source = computed(() => (route.query.source as string) || undefined)

// Qidiruvga 400 ms debounce — har harfda emas, foydalanuvchi to‘xtagach so‘rov ketadi.
const SEARCH_DEBOUNCE_MS = 400
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { search.value = value }, SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(debounceTimer))

// Filtr o‘zgarganda ro‘yxat boshidan boshlansin.
watch([category, search], () => { limit.value = PAGE_SIZE })

const { data: catalog, error, status } = await useAsyncData(
  `catalog:${shopSlug.value}`,
  () => api<Catalog>(`/public/shops/${shopSlug.value}`, {
    query: {
      category: category.value || undefined,
      search: search.value || undefined,
      source: source.value,
      limit: limit.value
    }
  }),
  { watch: [category, search, limit] }
)

// Tashrif faqat bir marta yoziladi: qidiruv/kategoriya/ko‘proq ko‘rsatish tashrif yozmaydi.
onMounted(() => {
  api(`/public/shops/${shopSlug.value}/visits`, {
    method: 'POST',
    body: { source: source.value ?? null, path: route.path }
  }).catch(() => {})
})

const hasMore = computed(() => !!catalog.value && catalog.value.products.length < catalog.value.total)

useSeoMeta({
  title: () => catalog.value ? `${catalog.value.business.name} — onlayn katalog` : 'Mebel katalogi',
  description: () => catalog.value?.business.description || 'Mobil mebel katalogi'
})
</script>

<template>
  <main v-if="catalog" class="catalog-page">
    <header class="shop-header shell">
      <div class="brand-block">
        <img v-if="catalog.business.logo_url" :src="resolveMediaUrl(catalog.business.logo_url)" :alt="catalog.business.name" class="shop-logo">
        <div>
          <span class="eyebrow">Onlayn katalog</span>
          <h1>{{ catalog.business.name }}</h1>
          <p>{{ catalog.business.description }}</p>
        </div>
      </div>
      <a v-if="catalog.business.phone" class="primary-button" :href="`tel:${catalog.business.phone}`">Qo‘ng‘iroq qilish</a>
    </header>

    <section class="hero shell">
      <div>
        <span class="hero-kicker">Showroom katalogi</span>
        <h2>Mebelingizni tanlang, tafsilotlarni ko‘ring va so‘rov yuboring.</h2>
        <p>Telefon orqali tez ochiladi. Har bir mahsulotda narx, o‘lcham va material ko‘rsatilgan.</p>
      </div>
      <div class="hero-stat">
        <strong>{{ catalog.total }}</strong>
        <span>mahsulot topildi</span>
      </div>
    </section>

    <section class="shell controls">
      <label class="search-box">
        <span>Qidiruv</span>
        <input v-model.trim="searchInput" type="search" placeholder="Masalan: divan">
      </label>
      <div class="category-list">
        <button :class="{ active: category === '' }" @click="category = ''">Barchasi</button>
        <button
          v-for="item in catalog.business.categories"
          :key="item.id"
          :class="{ active: category === item.slug }"
          @click="category = item.slug"
        >
          {{ item.name }}
        </button>
      </div>
    </section>

    <section class="shell product-grid">
      <ProductCard v-for="product in catalog.products" :key="product.id" :product="product" :shop-slug="shopSlug" :source="source" />
    </section>

    <section v-if="hasMore" class="shell load-more">
      <button class="secondary-button" @click="limit += PAGE_SIZE">
        Ko‘proq ko‘rsatish ({{ catalog.products.length }} / {{ catalog.total }})
      </button>
    </section>

    <section v-if="catalog.products.length === 0" class="empty-state shell">
      <h3>Mahsulot topilmadi</h3>
      <p>Qidiruv yoki kategoriyani o‘zgartiring.</p>
    </section>

    <footer class="shell footer-bar">
      <span>{{ catalog.business.address }}</span>
      <a v-if="catalog.business.telegram_username" :href="`https://t.me/${catalog.business.telegram_username}`" target="_blank">Telegram</a>
    </footer>
  </main>

  <main v-else class="shell state-page">
    <p v-if="status === 'pending'">Katalog yuklanmoqda…</p>
    <p v-else>{{ error?.message || 'Katalogni ochib bo‘lmadi.' }}</p>
  </main>
</template>
