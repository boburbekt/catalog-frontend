<script setup lang="ts">
interface Product {
  id: number
  name: string
  slug: string
  price: string
  availability: string
  image_url?: string | null
  category?: { name: string } | null
}

const api = useApi()
const token = useAdminToken()

const products = ref<Product[]>([])
const loading = ref(false)
const showForm = ref(false)
const saving = ref(false)
const message = ref('')
const authError = ref('')
const tokenInput = ref('')

const emptyForm = () => ({
  name: '',
  slug: '',
  price: 0,
  image_url: '',
  description: '',
  availability: 'in_stock'
})
const form = reactive(emptyForm())

watch(() => form.name, (value) => {
  form.slug = value
    .toLowerCase()
    .trim()
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
})

/** 401 — token eskirgan yoki noto‘g‘ri: cookie tozalanadi va kirish formasi qaytadi. */
const handleError = (error: any, fallback: string) => {
  if (error?.status === 401 || error?.response?.status === 401) {
    token.value = null
    products.value = []
    authError.value = 'Token yaroqsiz. Qaytadan kiriting.'
    return
  }
  message.value = error?.data?.detail || fallback
}

const loadProducts = async () => {
  if (!token.value) return
  loading.value = true
  try {
    products.value = await api<Product[]>('/admin/products')
    authError.value = ''
  } catch (e: any) {
    handleError(e, 'Mahsulotlarni yuklab bo‘lmadi.')
  } finally {
    loading.value = false
  }
}

const signIn = async () => {
  const value = tokenInput.value.trim()
  if (!value) return
  token.value = value
  tokenInput.value = ''
  authError.value = ''
  await loadProducts()
}

const signOut = () => {
  token.value = null
  products.value = []
  authError.value = ''
}

const saveProduct = async () => {
  saving.value = true
  message.value = ''
  try {
    await api('/admin/products', { method: 'POST', body: form })
    message.value = 'Mahsulot qo‘shildi.'
    Object.assign(form, emptyForm())
    showForm.value = false
    await loadProducts()
  } catch (e: any) {
    handleError(e, 'Saqlashda xato.')
  } finally {
    saving.value = false
  }
}

const downloadQr = async (kind: 'png' | 'svg', productSlug?: string) => {
  message.value = ''
  try {
    const blob = await api<Blob>(kind === 'png' ? '/admin/qr' : '/admin/qr.svg', {
      query: { product_slug: productSlug, source: 'qr' },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qr-${productSlug || 'katalog'}.${kind}`
    link.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    handleError(e, 'QR kodni yuklab bo‘lmadi.')
  }
}

onMounted(loadProducts)

const money = (value: string | number) => new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'
</script>

<template>
  <main v-if="!token" class="admin-page shell">
    <section class="login-card">
      <span class="eyebrow">Boshqaruv paneli</span>
      <h1>Kirish</h1>
      <p>Do‘koningizning admin tokenini kiriting.</p>
      <form class="login-form" @submit.prevent="signIn">
        <input
          v-model.trim="tokenInput"
          type="password"
          autocomplete="current-password"
          placeholder="Admin token"
          required
        >
        <button class="primary-button" type="submit">Kirish</button>
      </form>
      <p v-if="authError" class="error-message">{{ authError }}</p>
    </section>
  </main>

  <main v-else class="admin-page shell">
    <header class="admin-header">
      <div>
        <span class="eyebrow">Boshqaruv</span>
        <h1>Mahsulotlar</h1>
        <p>Do‘kon admin tokeningiz bo‘yicha aniqlanadi.</p>
      </div>
      <div class="admin-actions">
        <button class="secondary-button" @click="downloadQr('png')">QR (PNG)</button>
        <button class="secondary-button" @click="downloadQr('svg')">QR (SVG)</button>
        <button class="secondary-button" @click="signOut">Chiqish</button>
        <button class="primary-button" @click="showForm = !showForm">+ Mahsulot</button>
      </div>
    </header>

    <form v-if="showForm" class="admin-form" @submit.prevent="saveProduct">
      <label>Nomi<input v-model.trim="form.name" required></label>
      <label>Slug<input v-model.trim="form.slug" required></label>
      <label>Narxi<input v-model.number="form.price" type="number" min="1" required></label>
      <label>Rasm URL<input v-model.trim="form.image_url" type="url"></label>
      <label class="wide">Tavsif<textarea v-model.trim="form.description" rows="3"></textarea></label>
      <label>Holati<select v-model="form.availability"><option value="in_stock">Mavjud</option><option value="preorder">Buyurtma asosida</option></select></label>
      <button class="primary-button" :disabled="saving">{{ saving ? 'Saqlanmoqda…' : 'Saqlash' }}</button>
    </form>

    <p v-if="message" class="notice">{{ message }}</p>

    <section class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Holati</th><th>QR</th></tr></thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td><div class="table-product"><img :src="product.image_url || 'https://placehold.co/80x80?text=M'" :alt="product.name"><div><strong>{{ product.name }}</strong><small>{{ product.slug }}</small></div></div></td>
            <td>{{ product.category?.name || '—' }}</td>
            <td>{{ money(product.price) }}</td>
            <td><span class="status-pill">{{ product.availability === 'in_stock' ? 'Mavjud' : 'Buyurtma' }}</span></td>
            <td class="qr-cell">
              <button class="link-button" @click="downloadQr('png', product.slug)">PNG</button>
              <button class="link-button" @click="downloadQr('svg', product.slug)">SVG</button>
            </td>
          </tr>
          <tr v-if="!loading && products.length === 0">
            <td colspan="5">Hozircha mahsulot yo‘q.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.login-card {
  max-width: 420px;
  margin: 60px auto;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 32px;
  text-align: center;
}
.login-card h1 { font-size: 2rem; margin: 8px 0; }
.login-card p { color: var(--muted); margin: 0 0 20px; }
.login-form { display: grid; gap: 12px; }
/* `td` ni flexga aylantirsak qator balandligi buziladi — shuning uchun oddiy inline oqim. */
.qr-cell { white-space: nowrap; }
.qr-cell .link-button + .link-button { margin-left: 12px; }
.link-button {
  background: none;
  border: 0;
  padding: 0;
  color: var(--accent-dark);
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
</style>
