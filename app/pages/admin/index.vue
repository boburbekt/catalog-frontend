<script setup lang="ts">
interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  slug: string
  description?: string | null
  price: string
  old_price?: string | null
  material?: string | null
  dimensions?: string | null
  color?: string | null
  sku?: string | null
  image_url?: string | null
  availability: string
  position: number
  is_visible: boolean
  category?: Category | null
}

interface ProductForm {
  category_id: number | null
  name: string
  slug: string
  description: string
  price: number
  old_price: number | null
  material: string
  dimensions: string
  color: string
  sku: string
  image_url: string
  availability: string
  position: number
}

const api = useAdminApi()
const token = useAdminToken()
const { resolveMediaUrl } = useMedia()

const MAX_UPLOAD_MB = 8
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const products = ref<Product[]>([])
const loading = ref(false)
const showForm = ref(false)
const saving = ref(false)
/** null — yaratish rejimi; raqam — o‘sha `id` li mahsulotni tahrirlash. */
const editingId = ref<number | null>(null)
const message = ref('')
const errorMessage = ref('')
const authError = ref('')
const tokenInput = ref('')
const busyId = ref<number | null>(null)

// Rasm yuklash holati.
const imageFile = ref<File | null>(null)
const imagePreview = ref('') // yangi tanlangan fayl uchun object URL
const uploading = ref(false)

// Formada ko‘rsatiladigan rasm: yangi tanlangan fayl bo‘lsa o‘sha, aks holda mavjud rasm.
const shownImage = computed(() =>
  imagePreview.value || resolveMediaUrl(form.image_url) || ''
)

const clearImageSelection = () => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = ''
  imageFile.value = null
}

const onImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!ACCEPTED_TYPES.includes(file.type)) {
    errorMessage.value = 'Faqat JPEG, PNG yoki WebP rasm qabul qilinadi.'
    input.value = ''
    return
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    errorMessage.value = `Rasm hajmi ${MAX_UPLOAD_MB} MB dan oshmasligi kerak.`
    input.value = ''
    return
  }
  errorMessage.value = ''
  clearImageSelection()
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const uploadImage = async (productId: number) => {
  if (!imageFile.value) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', imageFile.value)
    await api(`/admin/products/${productId}/image`, { method: 'POST', body })
  } finally {
    uploading.value = false
  }
}

const emptyForm = (): ProductForm => ({
  category_id: null,
  name: '',
  slug: '',
  description: '',
  price: 0,
  old_price: null,
  material: '',
  dimensions: '',
  color: '',
  sku: '',
  image_url: '',
  availability: 'in_stock',
  position: 0
})
const form = reactive<ProductForm>(emptyForm())

const slugTouched = ref(false)
// Yaratishda slug nomdan avtomatik hosil bo‘ladi; foydalanuvchi qo‘lda tahrirlasa, to‘xtaydi.
watch(() => form.name, (value) => {
  if (editingId.value !== null || slugTouched.value) return
  form.slug = slugify(value)
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** 401 — token eskirgan yoki noto‘g‘ri: cookie tozalanadi va kirish formasi qaytadi. */
const handleError = (error: any, fallback: string) => {
  if (error?.status === 401 || error?.response?.status === 401) {
    token.value = null
    products.value = []
    authError.value = 'Token yaroqsiz. Qaytadan kiriting.'
    return
  }
  // 409 va boshqa xatolarda backend matni (masalan buyurtma tarixi) to‘g‘ridan-to‘g‘ri ko‘rsatiladi.
  errorMessage.value = error?.data?.detail || fallback
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

const resetMessages = () => {
  message.value = ''
  errorMessage.value = ''
}

const openCreate = () => {
  resetMessages()
  clearImageSelection()
  editingId.value = null
  slugTouched.value = false
  Object.assign(form, emptyForm())
  showForm.value = true
}

const openEdit = (product: Product) => {
  resetMessages()
  clearImageSelection()
  editingId.value = product.id
  slugTouched.value = true
  Object.assign(form, {
    category_id: product.category?.id ?? null,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: Number(product.price),
    old_price: product.old_price != null ? Number(product.old_price) : null,
    material: product.material ?? '',
    dimensions: product.dimensions ?? '',
    color: product.color ?? '',
    sku: product.sku ?? '',
    image_url: product.image_url ?? '',
    availability: product.availability,
    position: product.position
  })
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
  clearImageSelection()
}

/** Bo‘sh matn maydonini `null`ga, raqamli maydonni `number | null`ga keltiradi. */
const orNull = (value: unknown) =>
  value === '' || value === null || value === undefined ? null : value
const numOrNull = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const buildPayload = () => ({
  category_id: numOrNull(form.category_id),
  name: form.name.trim(),
  slug: form.slug.trim(),
  description: orNull(form.description.trim()),
  price: Number(form.price),
  old_price: numOrNull(form.old_price),
  material: orNull(form.material.trim()),
  dimensions: orNull(form.dimensions.trim()),
  color: orNull(form.color.trim()),
  sku: orNull(form.sku.trim()),
  availability: form.availability,
  position: Number(form.position)
})

const saveProduct = async () => {
  saving.value = true
  resetMessages()
  const payload = buildPayload()
  try {
    if (editingId.value === null) {
      // Avval mahsulot yaratamiz, so‘ng qaytgan ID bilan rasmni yuklaymiz.
      const created = await api<Product>('/admin/products', { method: 'POST', body: payload })
      await uploadImage(created.id)
      message.value = 'Mahsulot qo‘shildi.'
    } else {
      // Tahrirlashda `is_visible` yuborilmaydi — ko‘rinish alohida tugma orqali boshqariladi.
      await api(`/admin/products/${editingId.value}`, { method: 'PATCH', body: payload })
      // Yangi fayl tanlangan bo‘lsagina rasm yuklanadi.
      await uploadImage(editingId.value)
      message.value = 'Mahsulot yangilandi.'
    }
    closeForm()
    await loadProducts()
  } catch (e: any) {
    handleError(e, 'Saqlashda xato.')
  } finally {
    saving.value = false
  }
}

const toggleVisible = async (product: Product) => {
  resetMessages()
  busyId.value = product.id
  try {
    await api(`/admin/products/${product.id}`, {
      method: 'PATCH',
      body: { is_visible: !product.is_visible }
    })
    await loadProducts()
  } catch (e: any) {
    handleError(e, 'Ko‘rinishni o‘zgartirib bo‘lmadi.')
  } finally {
    busyId.value = null
  }
}

const deleteProduct = async (product: Product) => {
  if (!window.confirm(`“${product.name}” o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.`)) return
  resetMessages()
  busyId.value = product.id
  try {
    await api(`/admin/products/${product.id}`, { method: 'DELETE' })
    message.value = 'Mahsulot o‘chirildi.'
    await loadProducts()
  } catch (e: any) {
    // Buyurtma tarixi bo‘lsa backend 409 va aniq matn qaytaradi — o‘shani ko‘rsatamiz.
    handleError(e, 'O‘chirishda xato.')
  } finally {
    busyId.value = null
  }
}

const downloadQr = async (kind: 'png' | 'svg', productSlug?: string) => {
  resetMessages()
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

const money = (value: string | number) =>
  new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'

const AVAILABILITY_LABEL: Record<string, string> = {
  in_stock: 'Mavjud',
  preorder: 'Buyurtma asosida',
  out_of_stock: 'Tugagan'
}
const availabilityLabel = (value: string) => AVAILABILITY_LABEL[value] ?? value
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
    <AdminNav />
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
        <button class="primary-button" @click="openCreate">+ Mahsulot</button>
      </div>
    </header>

    <form v-if="showForm" class="admin-form" @submit.prevent="saveProduct">
      <div class="form-title wide">
        <strong>{{ editingId === null ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash' }}</strong>
        <button type="button" class="link-button" @click="closeForm">Bekor qilish</button>
      </div>
      <label>Nomi<input v-model.trim="form.name" required></label>
      <label>Slug<input v-model.trim="form.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required @input="slugTouched = true"></label>
      <label>Kategoriya ID<input v-model.number="form.category_id" type="number" min="1" placeholder="ixtiyoriy"></label>
      <label>Narxi<input v-model.number="form.price" type="number" min="1" step="0.01" required></label>
      <label>Eski narx<input v-model.number="form.old_price" type="number" min="1" step="0.01" placeholder="ixtiyoriy"></label>
      <label>Pozitsiya<input v-model.number="form.position" type="number" min="0"></label>
      <label>Material<input v-model.trim="form.material"></label>
      <label>O‘lchamlari<input v-model.trim="form.dimensions"></label>
      <label>Rangi<input v-model.trim="form.color" maxlength="60"></label>
      <label>SKU<input v-model.trim="form.sku" maxlength="60"></label>
      <label>Holati<select v-model="form.availability">
        <option value="in_stock">Mavjud</option>
        <option value="preorder">Buyurtma asosida</option>
        <option value="out_of_stock">Tugagan</option>
      </select></label>
      <label class="wide">Tavsif<textarea v-model.trim="form.description" rows="3"></textarea></label>

      <div class="image-field wide">
        <div class="image-field-controls">
          <label class="image-label">Rasm
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="onImageChange">
          </label>
          <small class="hint">JPEG, PNG yoki WebP · maksimal {{ MAX_UPLOAD_MB }} MB</small>
          <button v-if="imageFile" type="button" class="link-button" @click="clearImageSelection">Rasmni bekor qilish</button>
        </div>
        <div v-if="shownImage" class="image-preview">
          <img :src="shownImage" alt="Rasm ko‘rinishi">
        </div>
      </div>

      <div class="form-buttons wide">
        <button class="primary-button" :disabled="saving">
          {{ uploading ? 'Rasm yuklanmoqda…' : saving ? 'Saqlanmoqda…' : editingId === null ? 'Qo‘shish' : 'Yangilash' }}
        </button>
        <button type="button" class="secondary-button" @click="closeForm">Yopish</button>
      </div>
    </form>

    <p v-if="message" class="notice">{{ message }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <!-- Keng ekran: jadval -->
    <section class="admin-table-wrap desktop-only">
      <table class="admin-table">
        <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Holati</th><th>Ko‘rinish</th><th>Amallar</th></tr></thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" :class="{ 'row-hidden': !product.is_visible }">
            <td>
              <div class="table-product">
                <img :src="resolveMediaUrl(product.image_url) || 'https://placehold.co/80x80?text=M'" :alt="product.name">
                <div><strong>{{ product.name }}</strong><small>{{ product.slug }}</small></div>
              </div>
            </td>
            <td>{{ product.category?.name || '—' }}</td>
            <td>{{ money(product.price) }}</td>
            <td>
              <span class="status-pill" :class="{ 'status-out': product.availability === 'out_of_stock' }">
                {{ availabilityLabel(product.availability) }}
              </span>
            </td>
            <td>
              <span v-if="product.is_visible" class="badge badge-visible">Ko‘rinadi</span>
              <span v-else class="badge badge-hidden">Yashirilgan</span>
            </td>
            <td class="actions-cell">
              <button class="link-button" @click="openEdit(product)">Tahrirlash</button>
              <button class="link-button" :disabled="busyId === product.id" @click="toggleVisible(product)">
                {{ product.is_visible ? 'Yashirish' : 'Ko‘rsatish' }}
              </button>
              <button class="link-button danger" :disabled="busyId === product.id" @click="deleteProduct(product)">O‘chirish</button>
              <button class="link-button" @click="downloadQr('png', product.slug)">QR</button>
            </td>
          </tr>
          <tr v-if="!loading && products.length === 0">
            <td colspan="6">Hozircha mahsulot yo‘q.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Mobil: kartalar (360px da ishlaydi) -->
    <section class="product-cards mobile-only">
      <article v-for="product in products" :key="product.id" class="p-card" :class="{ 'row-hidden': !product.is_visible }">
        <div class="p-card-top">
          <img :src="resolveMediaUrl(product.image_url) || 'https://placehold.co/80x80?text=M'" :alt="product.name">
          <div class="p-card-info">
            <strong>{{ product.name }}</strong>
            <small>{{ product.slug }}</small>
            <span class="p-card-price">{{ money(product.price) }}</span>
          </div>
        </div>
        <div class="p-card-tags">
          <span class="status-pill" :class="{ 'status-out': product.availability === 'out_of_stock' }">
            {{ availabilityLabel(product.availability) }}
          </span>
          <span v-if="!product.is_visible" class="badge badge-hidden">Yashirilgan</span>
          <span class="p-card-cat">{{ product.category?.name || 'Kategoriyasiz' }}</span>
        </div>
        <div class="p-card-actions">
          <button class="secondary-button" @click="openEdit(product)">Tahrirlash</button>
          <button class="secondary-button" :disabled="busyId === product.id" @click="toggleVisible(product)">
            {{ product.is_visible ? 'Yashirish' : 'Ko‘rsatish' }}
          </button>
          <button class="secondary-button" @click="downloadQr('png', product.slug)">QR</button>
          <button class="secondary-button danger" :disabled="busyId === product.id" @click="deleteProduct(product)">O‘chirish</button>
        </div>
      </article>
      <p v-if="!loading && products.length === 0" class="empty">Hozircha mahsulot yo‘q.</p>
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

.form-title { display: flex; align-items: center; justify-content: space-between; }
.form-title strong { font-size: 1.1rem; }
.form-buttons { display: flex; gap: 12px; flex-wrap: wrap; }

.image-field { display: grid; gap: 12px; }
.image-field-controls { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.image-label { display: grid; gap: 6px; font-weight: 700; }
.image-field .hint { color: var(--muted); }
.image-preview img {
  width: 140px; height: 140px; object-fit: cover;
  border-radius: 14px; border: 1px solid var(--line);
}

.actions-cell { white-space: nowrap; }
.actions-cell .link-button + .link-button { margin-left: 14px; }
.link-button {
  background: none;
  border: 0;
  padding: 0;
  color: var(--accent-dark);
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
.link-button:disabled { opacity: .5; cursor: wait; }
.link-button.danger, .secondary-button.danger { color: #a32323; }

.badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
.badge-visible { background: #e8f3ed; color: var(--success); }
.badge-hidden { background: #f3e2e2; color: #a32323; }
.status-out { background: #f3e2e2 !important; color: #a32323 !important; }
.row-hidden { opacity: .6; }

/* Ekran o‘lchamiga qarab jadval yoki kartalar. */
.mobile-only { display: none; }
.product-cards { display: grid; gap: 14px; }
.p-card { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 16px; }
.p-card-top { display: flex; gap: 12px; }
.p-card-top img { width: 64px; height: 64px; object-fit: cover; border-radius: 12px; flex: none; }
.p-card-info { display: grid; gap: 2px; min-width: 0; }
.p-card-info small { color: var(--muted); word-break: break-all; }
.p-card-price { font-weight: 800; margin-top: 4px; }
.p-card-tags { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 12px 0; }
.p-card-cat { color: var(--muted); font-size: .8rem; }
.p-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.p-card-actions .secondary-button { padding: 10px 12px; font-size: .9rem; }
.empty { color: var(--muted); text-align: center; padding: 24px; }

@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
}
</style>
