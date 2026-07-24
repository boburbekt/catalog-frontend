<script setup lang="ts">
import type { Product } from '~/types/api'

const route = useRoute()
const api = usePublicApi()
const { resolveMediaUrl } = useMedia()
const shopSlug = String(route.params.shopSlug)
const productSlug = String(route.params.productSlug)

// QR/reklama havolalaridagi `?source=` backendga uzatiladi — statistika shu asosda yig‘iladi.
const source = computed(() => (route.query.source as string) || undefined)

const { data: product, error } = await useAsyncData(
  `product:${shopSlug}:${productSlug}`,
  () => api<Product>(`/public/shops/${shopSlug}/products/${productSlug}`, {
    query: { source: source.value }
  })
)

// `honeypot` — yashirin maydon (bot to‘ldiradi); `consent` — majburiy rozilik.
const form = reactive({ customer_name: '', customer_phone: '', quantity: 1, comment: '', honeypot: '', consent: false })
const sending = ref(false)
const successMessage = ref('')
const formError = ref('')

// Katalogga qaytish havolasida ham manba saqlanadi.
const backTo = computed(() => ({
  path: `/${shopSlug}`,
  query: source.value ? { source: source.value } : {}
}))

// Mahsulot ochilganda bir marta tashrif yoziladi (view_count backendda oshadi).
onMounted(() => {
  if (!product.value) return
  api(`/public/shops/${shopSlug}/visits`, {
    method: 'POST',
    body: { product_id: product.value.id, source: source.value ?? null, path: route.path }
  }).catch(() => {})
})

const submitOrder = async () => {
  if (!product.value) return
  sending.value = true
  formError.value = ''
  successMessage.value = ''
  try {
    const result = await api<{ id: number; message: string }>(`/public/shops/${shopSlug}/orders`, {
      method: 'POST',
      query: { source: source.value },
      body: { ...form, product_id: product.value.id }
    })
    successMessage.value = `${result.message}. Buyurtma №${result.id}`
    form.customer_name = ''
    form.customer_phone = ''
    form.quantity = 1
    form.comment = ''
    form.honeypot = ''
    form.consent = false
  } catch (e: any) {
    formError.value = e?.data?.detail || 'Buyurtmani yuborib bo‘lmadi.'
  } finally {
    sending.value = false
  }
}

// SEO: absolute canonical + OG/Twitter. Manba (`?source=`) canonical'ga kiritilmaydi.
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
const canonicalUrl = computed(() => `${siteUrl}/${shopSlug}/product/${productSlug}`)
const ogImage = computed(() => resolveMediaUrl(product.value?.image_url) || undefined)
const pageTitle = computed(() =>
  product.value ? `${product.value.name} — narx va tavsif` : 'Mahsulot'
)
const pageDescription = computed(() => product.value?.description || 'Mahsulot tafsiloti')

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }]
})
useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogType: 'website',
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: ogImage,
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: ogImage
})
</script>

<template>
  <main v-if="product" class="product-page shell">
    <NuxtLink :to="backTo" class="back-link">← Katalogga qaytish</NuxtLink>

    <section class="product-detail">
      <div class="detail-image-wrap">
        <img :src="resolveMediaUrl(product.image_url) || 'https://placehold.co/1000x800?text=Mebel'" :alt="product.name" class="detail-image">
      </div>

      <div class="detail-content">
        <span class="eyebrow">{{ product.category?.name || 'Mebel' }}</span>
        <h1>{{ product.name }}</h1>
        <p class="detail-description">{{ product.description }}</p>
        <div class="detail-price">
          <strong>{{ money(product.price) }}</strong>
          <del v-if="product.old_price">{{ money(product.old_price) }}</del>
        </div>
        <dl class="spec-list">
          <div><dt>Material</dt><dd>{{ product.material || 'Ko‘rsatilmagan' }}</dd></div>
          <div><dt>O‘lcham</dt><dd>{{ product.dimensions || 'Ko‘rsatilmagan' }}</dd></div>
          <div><dt>Holati</dt><dd>{{ product.availability === 'in_stock' ? 'Mavjud' : 'Buyurtma asosida' }}</dd></div>
        </dl>
      </div>
    </section>

    <section class="order-section">
      <div>
        <span class="eyebrow">Buyurtma</span>
        <h2>Do‘kon siz bilan bog‘lanadi</h2>
        <p>Ism va telefon raqamingizni qoldiring. To‘lov hozir olinmaydi.</p>
      </div>
      <form class="order-form" @submit.prevent="submitOrder">
        <label>Ismingiz<input v-model.trim="form.customer_name" required minlength="2" placeholder="Jasurbek"></label>
        <label>Telefon<input v-model.trim="form.customer_phone" required minlength="7" placeholder="+998 90 123 45 67"></label>
        <label>Miqdor<input v-model.number="form.quantity" required type="number" min="1" max="99"></label>
        <label>Izoh<textarea v-model.trim="form.comment" rows="3" placeholder="Rang yoki yetkazib berish bo‘yicha savol"></textarea></label>

        <!-- Honeypot: haqiqiy foydalanuvchi ko‘rmaydi va to‘ldirmaydi; bot to‘ldirsa buyurtma rad etiladi. -->
        <div class="hp-field" aria-hidden="true">
          <label>Veb-sayt<input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off"></label>
        </div>

        <label class="consent-label full">
          <input v-model="form.consent" type="checkbox" required>
          <span>Telefon raqamimni yuborish orqali buyurtma bo‘yicha men bilan bog‘lanishga roziman.</span>
        </label>

        <button class="primary-button full" :disabled="sending || !form.consent">{{ sending ? 'Yuborilmoqda…' : 'Buyurtma yuborish' }}</button>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="formError" class="error-message">{{ formError }}</p>
      </form>
    </section>
  </main>

  <main v-else class="shell state-page">
    <p>{{ error?.message || 'Mahsulot yuklanmoqda…' }}</p>
  </main>
</template>

<style scoped>
/* Honeypot ekrandan tashqarida — foydalanuvchi ko‘rmaydi, lekin DOM'da mavjud (botlar to‘ldiradi). */
.hp-field {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.consent-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-weight: 600;
  cursor: pointer;
}
.consent-label input {
  width: auto;
  margin-top: 3px;
  flex: none;
}
.consent-label span { line-height: 1.4; }
</style>
