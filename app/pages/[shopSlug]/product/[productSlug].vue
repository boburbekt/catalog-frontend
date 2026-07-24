<script setup lang="ts">
interface Product {
  id: number
  name: string
  slug: string
  description?: string | null
  price: string
  old_price?: string | null
  material?: string | null
  dimensions?: string | null
  image_url?: string | null
  availability: string
  category?: { name: string; slug: string } | null
}

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

const form = reactive({ customer_name: '', customer_phone: '', quantity: 1, comment: '' })
const sending = ref(false)
const successMessage = ref('')
const formError = ref('')

const money = (value: string | number) => new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'

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
  } catch (e: any) {
    formError.value = e?.data?.detail || 'Buyurtmani yuborib bo‘lmadi.'
  } finally {
    sending.value = false
  }
}

useSeoMeta({
  title: () => product.value ? `${product.value.name} — narx va tavsif` : 'Mahsulot',
  description: () => product.value?.description || 'Mahsulot tafsiloti'
})
</script>

<template>
  <main v-if="product" class="product-page shell">
    <NuxtLink :to="`/${shopSlug}`" class="back-link">← Katalogga qaytish</NuxtLink>

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
        <button class="primary-button full" :disabled="sending">{{ sending ? 'Yuborilmoqda…' : 'Buyurtma yuborish' }}</button>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="formError" class="error-message">{{ formError }}</p>
      </form>
    </section>
  </main>

  <main v-else class="shell state-page">
    <p>{{ error?.message || 'Mahsulot yuklanmoqda…' }}</p>
  </main>
</template>
