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
}

const route = useRoute()
const api = useApi()
const search = ref('')
const category = ref('')
const shopSlug = computed(() => String(route.params.shopSlug))

const { data: catalog, error, status } = await useAsyncData(
  `catalog:${shopSlug.value}`,
  () => api<Catalog>(`/public/shops/${shopSlug.value}`, {
    query: {
      category: category.value || undefined,
      search: search.value || undefined
    }
  }),
  { watch: [category, search] }
)

useSeoMeta({
  title: () => catalog.value ? `${catalog.value.business.name} — onlayn katalog` : 'Mebel katalogi',
  description: () => catalog.value?.business.description || 'Mobil mebel katalogi'
})
</script>

<template>
  <main v-if="catalog" class="catalog-page">
    <header class="shop-header shell">
      <div class="brand-block">
        <img v-if="catalog.business.logo_url" :src="catalog.business.logo_url" :alt="catalog.business.name" class="shop-logo">
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
        <strong>{{ catalog.products.length }}</strong>
        <span>mahsulot topildi</span>
      </div>
    </section>

    <section class="shell controls">
      <label class="search-box">
        <span>Qidiruv</span>
        <input v-model.trim="search" type="search" placeholder="Masalan: divan">
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
      <ProductCard v-for="product in catalog.products" :key="product.id" :product="product" :shop-slug="shopSlug" />
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
