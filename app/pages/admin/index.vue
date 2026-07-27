<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import type { Category, Product } from '~/types/api'

interface ProductForm {
  category_id: number | null
  name: string
  slug: string
  description: string
  price: number | null
  old_price: number | null
  material: string
  dimensions: string
  color: string
  sku: string
  image_url: string
  availability: string
  position: number
  is_visible: boolean
}

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { token, signOut } = useAdminAuth()
const { resolveMediaUrl } = useMedia()

// Admin sahifalari qidiruv tizimlariga tushmasligi kerak.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const MAX_UPLOAD_MB = 8
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Mavjudlik holati — biznes tilida yorliq + qisqa izoh (texnik qiymatlar yashirin).
const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'Mavjud', hint: 'Hozir sotuvda.' },
  { value: 'preorder', label: 'Buyurtma asosida', hint: 'Tayyorlash yoki olib kelish kerak.' },
  { value: 'out_of_stock', label: 'Hozir mavjud emas', hint: 'Buyurtma qabul qilinmaydi.' }
]

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const showForm = ref(false)
const saving = ref(false)
/** null — yaratish rejimi; raqam — o‘sha `id` li mahsulotni tahrirlash. */
const editingId = ref<number | null>(null)
const message = ref('')
const errorMessage = ref('')
const busyId = ref<number | null>(null)

// Rasm yuklash holati.
const imageFile = ref<File | null>(null)
const imagePreview = ref('') // yangi tanlangan fayl uchun object URL
const uploading = ref(false)
const dragging = ref(false)

const emptyForm = (): ProductForm => ({
  category_id: null,
  name: '',
  slug: '',
  description: '',
  price: null,
  old_price: null,
  material: '',
  dimensions: '',
  color: '',
  sku: '',
  image_url: '',
  availability: 'in_stock',
  position: 0,
  is_visible: true
})
const form = reactive<ProductForm>(emptyForm())

// Formada ko‘rsatiladigan rasm: yangi tanlangan fayl bo‘lsa o‘sha, aks holda mavjud rasm.
const shownImage = computed(() =>
  imagePreview.value || resolveMediaUrl(form.image_url) || ''
)

const clearImageSelection = () => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = ''
  imageFile.value = null
}

// Fayl tanlash (input yoki drag-drop) — yagona tekshiruv.
const handleFile = (file: File | undefined | null) => {
  if (!file) return
  if (!ACCEPTED_TYPES.includes(file.type)) {
    errorMessage.value = 'Faqat JPEG, PNG yoki WebP rasm qabul qilinadi.'
    return
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    errorMessage.value = `Rasm hajmi ${MAX_UPLOAD_MB} MB dan oshmasligi kerak.`
    return
  }
  errorMessage.value = ''
  clearImageSelection()
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const onImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  handleFile(input.files?.[0])
  input.value = '' // bir xil faylni qayta tanlash mumkin bo‘lsin
}

const onDrop = (event: DragEvent) => {
  dragging.value = false
  handleFile(event.dataTransfer?.files?.[0])
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

// ---- Narx: preview, chegirma va ogohlantirish ----
const pricePreview = computed(() => {
  const p = Number(form.price)
  return Number.isFinite(p) && p > 0 ? money(p) : ''
})
const discountPreview = computed(() => {
  const p = Number(form.price)
  if (!Number.isFinite(p) || p <= 0) return null
  return discountLabel(p, form.old_price)
})
const oldPriceWarning = computed(() => {
  if (form.old_price === null || (form.old_price as unknown) === '') return ''
  const o = Number(form.old_price)
  if (!Number.isFinite(o) || o <= 0) return 'Eski narx musbat son bo‘lishi kerak.'
  const p = Number(form.price)
  if (Number.isFinite(p) && o <= p) {
    return 'Eski narx joriy narxdan katta bo‘lishi kerak — aks holda chegirma ko‘rinmaydi.'
  }
  return ''
})
const availabilityHint = computed(() =>
  AVAILABILITY_OPTIONS.find((o) => o.value === form.availability)?.hint ?? ''
)

/**
 * Summa inputi (narx / eski narx): kiritilayotgan raqamlarni minglik bo‘sh joy
 * bilan formatlab ko‘rsatadi, form’dagi qiymatni esa toza son sifatida saqlaydi.
 */
const onAmountInput = (e: Event, field: 'price' | 'old_price'): void => {
  const el = e.target as HTMLInputElement
  const n = parseAmount(el.value)
  form[field] = n
  el.value = formatAmountInput(n)
}

// ---- Field validatsiya ----
const fieldErrors = reactive<{ name: string, price: string }>({ name: '', price: '' })
const validate = (): boolean => {
  fieldErrors.name = ''
  fieldErrors.price = ''
  if (form.name.trim().length < 2) {
    fieldErrors.name = 'Mahsulot nomi kamida 2 ta belgidan iborat bo‘lsin.'
  }
  const p = Number(form.price)
  if (!Number.isFinite(p) || p <= 0) {
    fieldErrors.price = 'Narx 0 dan katta musbat son bo‘lishi kerak.'
  }
  return !fieldErrors.name && !fieldErrors.price
}

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

const handleError = (error: any, fallback: string) => {
  if (isUnauthorized(error)) { signOut(); products.value = []; return }
  // 409 (duplicate slug / buyurtma tarixi) va boshqalar do‘stona matnga o‘giriladi.
  errorMessage.value = adminErrorMessage(error, fallback)
}

const loadProducts = async () => {
  if (!token.value) return
  loading.value = true
  try {
    products.value = await api<Product[]>('/admin/products')
  } catch (e: any) {
    handleError(e, 'Mahsulotlarni yuklab bo‘lmadi.')
  } finally {
    loading.value = false
  }
}

// Kategoriyalar formadagi `<select>` uchun yuklanadi (qo‘lda ID kiritish o‘rniga).
const loadCategories = async () => {
  if (!token.value) return
  try {
    categories.value = await api<Category[]>('/admin/categories')
  } catch {
    // Kategoriyalar yuklanmasa ham mahsulot boshqaruvi ishlashda davom etsin.
  }
}

const resetMessages = () => {
  message.value = ''
  errorMessage.value = ''
  fieldErrors.name = ''
  fieldErrors.price = ''
}

// ---- Saqlanmagan o‘zgarishlar himoyasi ----
const formSnapshot = ref('')
const dirty = computed(() =>
  showForm.value && (
    (formSnapshot.value !== '' && formSnapshot.value !== JSON.stringify(form)) ||
    !!imageFile.value
  )
)
const takeSnapshot = () => { formSnapshot.value = JSON.stringify(form) }

const openCreate = () => {
  resetMessages()
  clearImageSelection()
  editingId.value = null
  slugTouched.value = false
  Object.assign(form, emptyForm(), {
    // Pozitsiya avtomatik: mavjud eng katta + 1 (foydalanuvchi o‘ylamasligi uchun).
    position: products.value.length ? Math.max(...products.value.map((p) => p.position)) + 1 : 0
  })
  takeSnapshot()
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
    position: product.position,
    is_visible: product.is_visible
  })
  takeSnapshot()
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
  formSnapshot.value = ''
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
  position: Number(form.position),
  is_visible: form.is_visible
})

const saveProduct = async () => {
  if (saving.value) return // ikki marta submit bo‘lmasin
  resetMessages()
  if (!validate()) {
    errorMessage.value = 'Ba’zi maydonlar to‘ldirilmagan. Belgilangan joylarni tekshiring.'
    return
  }
  saving.value = true
  const payload = buildPayload()
  const isCreate = editingId.value === null
  try {
    // 1-qadam: mahsulotni saqlash (POST yoki PATCH). Bu muvaffaqiyatsiz bo‘lsa hech narsa yaratilmaydi.
    let productId: number
    if (isCreate) {
      const created = await api<Product>('/admin/products', { method: 'POST', body: payload })
      productId = created.id
      // Mahsulot yaratildi — formani darrov tahrirlash rejimiga o‘tkazamiz.
      // Shu tufayli rasm yuklash muvaffaqiyatsiz bo‘lsa ham, qayta "Saqlash" POST emas,
      // PATCH bo‘ladi — duplicate slug yaratilmaydi.
      editingId.value = created.id
      slugTouched.value = true
      form.image_url = created.image_url ?? ''
      takeSnapshot()
    } else {
      await api(`/admin/products/${editingId.value}`, { method: 'PATCH', body: payload })
      productId = editingId.value as number
    }

    // 2-qadam: rasm yuklash — alohida bosqich. Muvaffaqiyatsiz bo‘lsa mahsulot baribir saqlangan.
    if (imageFile.value) {
      try {
        await uploadImage(productId)
      } catch (imgErr: any) {
        if (isUnauthorized(imgErr)) { handleError(imgErr, ''); return }
        // Partial-success: mahsulot saqlandi, lekin rasm yuklanmadi.
        await loadProducts()
        errorMessage.value = isCreate
          ? 'Mahsulot saqlandi, lekin rasm yuklanmadi. Mahsulotni qayta yaratish shart emas. Rasmni qayta yuklang.'
          : 'Mahsulot yangilandi, lekin rasm yuklanmadi. Rasmni qayta yuklang.'
        // Forma ochiq qoladi (endi tahrirlash rejimida) — foydalanuvchi shu yerda qayta urinadi.
        return
      }
    }

    message.value = isCreate ? 'Mahsulot qo‘shildi.' : 'Mahsulot yangilandi.'
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

// Saqlanmagan o‘zgarishlar bilan boshqa sahifaga o‘tishga urinilsa ogohlantiramiz.
const UNSAVED = 'Saqlanmagan o‘zgarishlar mavjud. Sahifadan chiqilsinmi?'
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm(UNSAVED)) return false
})
const onBeforeUnload = (e: BeforeUnloadEvent) => { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }

onMounted(() => {
  loadProducts()
  loadCategories()
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
// money(), availabilityLabel(), discountLabel() — `~/composables/format.ts` dan avtomatik import.
</script>

<template>
  <main class="admin-content">
    <header class="admin-header">
      <div>
        <span class="eyebrow">Boshqaruv</span>
        <h1>Mahsulotlar</h1>
        <p>Katalogingizni shu yerdan boshqaring.</p>
      </div>
      <div class="admin-actions">
        <button type="button" class="secondary-button" @click="downloadQr('png')">QR (PNG)</button>
        <button type="button" class="secondary-button" @click="downloadQr('svg')">QR (SVG)</button>
        <button type="button" class="primary-button" @click="openCreate">+ Mahsulot</button>
      </div>
    </header>

    <form v-if="showForm" class="admin-form product-form" @submit.prevent="saveProduct">
      <div class="form-title">
        <strong>{{ editingId === null ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash' }}</strong>
        <button type="button" class="link-button" @click="closeForm">Bekor qilish</button>
      </div>

      <!-- Asosiy ma'lumotlar -->
      <fieldset class="form-group">
        <legend>Asosiy ma’lumotlar</legend>
        <div class="group-grid">
          <label class="span2">Mahsulot nomi
            <input v-model.trim="form.name" required :aria-invalid="!!fieldErrors.name">
            <small v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</small>
          </label>

          <label>Kategoriya
            <select v-model="form.category_id" :disabled="categories.length === 0">
              <option :value="null">Kategoriyasiz</option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
                :disabled="editingId === null && !cat.is_active"
              >{{ cat.name }}{{ cat.is_active ? '' : ' (faol emas)' }}</option>
            </select>
            <small v-if="categories.length === 0" class="field-hint">
              Avval kategoriya yarating —
              <NuxtLink to="/admin/categories" class="inline-link">Kategoriyalar sahifasi</NuxtLink>.
            </small>
          </label>

          <label>Mavjudlik holati
            <select v-model="form.availability">
              <option v-for="opt in AVAILABILITY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <small class="field-hint">{{ availabilityHint }}</small>
          </label>

          <label>Narx
            <span class="num-input">
              <input :value="formatAmountInput(form.price)" @input="onAmountInput($event, 'price')" type="text" inputmode="numeric" required :aria-invalid="!!fieldErrors.price">
              <span class="suffix">so‘m</span>
            </span>
            <small v-if="fieldErrors.price" class="field-error">{{ fieldErrors.price }}</small>
            <small v-else-if="pricePreview" class="field-hint">{{ pricePreview }}</small>
          </label>

          <label>Eski narx (ixtiyoriy)
            <span class="num-input">
              <input :value="formatAmountInput(form.old_price)" @input="onAmountInput($event, 'old_price')" type="text" inputmode="numeric" placeholder="chegirma uchun">
              <span class="suffix">so‘m</span>
            </span>
            <small v-if="oldPriceWarning" class="field-warning">{{ oldPriceWarning }}</small>
            <small v-else-if="discountPreview" class="field-ok">Chegirma: {{ discountPreview }}</small>
          </label>
        </div>
      </fieldset>

      <!-- Tavsif va xususiyatlar -->
      <fieldset class="form-group">
        <legend>Tavsif va xususiyatlar</legend>
        <div class="group-grid">
          <label class="span2">Tavsif<textarea v-model.trim="form.description" rows="3"></textarea></label>
          <label>Material<input v-model.trim="form.material"></label>
          <label>O‘lchamlari<input v-model.trim="form.dimensions"></label>
          <label>Rangi<input v-model.trim="form.color" maxlength="60"></label>
        </div>
      </fieldset>

      <!-- Rasm -->
      <fieldset class="form-group">
        <legend>Rasm</legend>
        <div
          class="image-upload"
          :class="{ dragging }"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <div v-if="shownImage" class="image-preview-lg">
            <img :src="shownImage" alt="Mahsulot rasmi ko‘rinishi">
          </div>
          <div v-else class="image-placeholder">
            <ProductImage :src="null" alt="Rasm tanlanmagan" class="ph-box" />
          </div>

          <div class="upload-controls">
            <label class="upload-btn">
              <input class="sr-file" type="file" accept="image/jpeg,image/png,image/webp" @change="onImageChange">
              <span>{{ shownImage ? 'Rasmni almashtirish' : 'Rasm tanlash' }}</span>
            </label>
            <button v-if="imageFile" type="button" class="link-button" @click="clearImageSelection">Bekor qilish</button>
            <small class="field-hint">JPEG, PNG yoki WebP · maksimal {{ MAX_UPLOAD_MB }} MB. Kompyuterda faylni sudrab tashlash ham mumkin.</small>
            <small v-if="uploading" class="field-hint">Rasm yuklanmoqda…</small>
          </div>
        </div>
      </fieldset>

      <!-- Qo'shimcha sozlamalar (texnik maydonlar yashirin) -->
      <details class="advanced">
        <summary>Qo‘shimcha sozlamalar</summary>
        <div class="advanced-grid">
          <label>Slug (nomdan avtomatik)
            <input v-model.trim="form.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required @input="slugTouched = true">
          </label>
          <label>Tartib (position)<input v-model.number="form.position" type="number" min="0"></label>
          <label>SKU (artikul)<input v-model.trim="form.sku" maxlength="60"></label>
          <label class="checkbox-label"><input v-model="form.is_visible" type="checkbox"> Katalogda ko‘rinsin</label>
        </div>
      </details>

      <p v-if="message" class="notice" role="status">{{ message }}</p>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <div class="form-buttons">
        <button class="primary-button" type="submit" :disabled="saving">
          {{ uploading ? 'Rasm yuklanmoqda…' : saving ? 'Saqlanmoqda…' : editingId === null ? 'Saqlash' : 'O‘zgarishlarni saqlash' }}
        </button>
        <button type="button" class="secondary-button" @click="closeForm">Bekor qilish</button>
      </div>
    </form>

    <template v-if="!showForm">
      <p v-if="message" class="notice" role="status">{{ message }}</p>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    </template>

    <!-- Bo'sh holat -->
    <div v-if="!loading && products.length === 0" class="empty-box">
      <h3>Hozircha mahsulot yo‘q</h3>
      <p>Birinchi mahsulotingizni qo‘shing — 1–2 daqiqada tayyor bo‘ladi.</p>
      <button type="button" class="primary-button" @click="openCreate">+ Birinchi mahsulot</button>
    </div>

    <!-- Keng ekran: jadval -->
    <section v-if="products.length" class="admin-table-wrap desktop-only">
      <table class="admin-table">
        <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Holati</th><th>Ko‘rinish</th><th>Amallar</th></tr></thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" :class="{ 'row-hidden': !product.is_visible }">
            <td>
              <div class="table-product">
                <ProductImage :src="product.image_url" :alt="product.name" class="thumb" />
                <div><strong>{{ product.name }}</strong><small>{{ product.slug }}</small></div>
              </div>
            </td>
            <td>{{ product.category?.name || '—' }}</td>
            <td>{{ money(product.price) }}</td>
            <td><AvailabilityBadge :availability="product.availability" /></td>
            <td>
              <span v-if="product.is_visible" class="badge badge-visible">Ko‘rinadi</span>
              <span v-else class="badge badge-hidden">Yashirilgan</span>
            </td>
            <td class="actions-cell">
              <button type="button" class="link-button" @click="openEdit(product)">Tahrirlash</button>
              <button type="button" class="link-button" :disabled="busyId === product.id" @click="toggleVisible(product)">
                {{ product.is_visible ? 'Yashirish' : 'Ko‘rsatish' }}
              </button>
              <button type="button" class="link-button" @click="downloadQr('png', product.slug)">QR</button>
              <button type="button" class="link-button danger" :disabled="busyId === product.id" @click="deleteProduct(product)">O‘chirish</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Mobil: kartalar (360px da ishlaydi) -->
    <section v-if="products.length" class="product-cards mobile-only">
      <article v-for="product in products" :key="product.id" class="p-card" :class="{ 'row-hidden': !product.is_visible }">
        <div class="p-card-top">
          <ProductImage :src="product.image_url" :alt="product.name" class="thumb" />
          <div class="p-card-info">
            <strong>{{ product.name }}</strong>
            <span class="p-card-price">{{ money(product.price) }}</span>
            <span class="p-card-cat">{{ product.category?.name || 'Kategoriyasiz' }}</span>
          </div>
        </div>
        <div class="p-card-tags">
          <AvailabilityBadge :availability="product.availability" />
          <span v-if="!product.is_visible" class="badge badge-hidden">Yashirilgan</span>
        </div>
        <div class="p-card-actions">
          <button type="button" class="secondary-button" @click="openEdit(product)">Tahrirlash</button>
          <button type="button" class="secondary-button" :disabled="busyId === product.id" @click="toggleVisible(product)">
            {{ product.is_visible ? 'Yashirish' : 'Ko‘rsatish' }}
          </button>
          <button type="button" class="secondary-button" @click="downloadQr('png', product.slug)">QR</button>
          <button type="button" class="secondary-button danger" :disabled="busyId === product.id" @click="deleteProduct(product)">O‘chirish</button>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.form-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.form-title strong { font-size: 1.15rem; }

/* Mahsulot formasi — bo'limlarga (fieldset) ajratilgan, bir ustunli stack. */
.product-form { grid-template-columns: 1fr; gap: 18px; }
.form-group { border: 1px solid var(--line); border-radius: 16px; padding: 18px; margin: 0; background: var(--bg); }
.form-group legend {
  font-weight: 800; font-size: .82rem; text-transform: uppercase; letter-spacing: .06em;
  color: var(--accent-dark); padding: 0 8px;
}
.group-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.group-grid .span2 { grid-column: 1 / -1; }
.group-grid label, .advanced-grid label { display: grid; gap: 6px; font-weight: 700; align-content: start; }

/* Narx inputi + suffix. */
.num-input { position: relative; display: block; }
.num-input input { width: 100%; padding-right: 52px; }
.num-input .suffix {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  color: var(--muted); font-weight: 700; font-size: .9rem; pointer-events: none;
}

.field-hint { color: var(--muted); font-weight: 600; }
.field-error { color: #a32323; font-weight: 700; }
.field-warning { color: #8a6a1f; font-weight: 700; }
.field-ok { color: var(--success); font-weight: 700; }
.inline-link { color: var(--accent-dark); font-weight: 800; text-decoration: underline; }

/* Rasm yuklash area. */
.image-upload {
  display: flex; gap: 18px; align-items: center; flex-wrap: wrap;
  border: 2px dashed var(--line); border-radius: 16px; padding: 18px; background: var(--surface);
  transition: border-color .15s ease, background .15s ease;
}
.image-upload.dragging { border-color: var(--accent); background: #f6efe4; }
.image-preview-lg img, .image-placeholder .ph-box {
  width: 150px; height: 150px; object-fit: cover; border-radius: 14px; border: 1px solid var(--line); flex: none;
}
.upload-controls { display: grid; gap: 8px; min-width: 200px; flex: 1; }
.upload-btn {
  display: inline-flex; align-items: center; justify-content: center; width: fit-content;
  border-radius: 999px; padding: 11px 20px; font-weight: 750; border: 1px solid var(--line);
  background: var(--surface); cursor: pointer;
}
.upload-btn:hover { border-color: var(--accent); }
.upload-btn:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgb(150 109 63 / 15%); }
.sr-file { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }

/* Qo'shimcha sozlamalar accordion. */
.advanced { border: 1px solid var(--line); border-radius: 16px; padding: 4px 18px; background: var(--bg); }
.advanced summary { cursor: pointer; font-weight: 800; padding: 12px 0; color: var(--accent-dark); }
.advanced-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 6px 0 16px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.checkbox-label input { width: auto; }

.form-buttons { display: flex; gap: 12px; flex-wrap: wrap; }

/* Bo'sh holat. */
.empty-box {
  text-align: center; padding: 52px 24px; background: var(--surface);
  border: 1px dashed var(--line); border-radius: 18px;
}
.empty-box h3 { margin: 0 0 8px; font-size: 1.4rem; }
.empty-box p { color: var(--muted); margin: 0 0 18px; }

.actions-cell { white-space: nowrap; }
.actions-cell .link-button + .link-button { margin-left: 16px; }
.link-button {
  background: none; border: 0; padding: 0; color: var(--accent-dark);
  font-weight: 700; text-decoration: underline; cursor: pointer;
}
.link-button:disabled { opacity: .5; cursor: wait; }
.link-button.danger, .secondary-button.danger { color: #a32323; }

.badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
.badge-visible { background: #e8f3ed; color: var(--success); }
.badge-hidden { background: #f3e2e2; color: #a32323; }
.row-hidden { opacity: .55; }
.row-hidden td:first-child::after { content: ' · yashirilgan'; color: var(--muted); font-size: .75rem; }

/* Ekran o‘lchamiga qarab jadval yoki kartalar. */
.mobile-only { display: none; }
.product-cards { display: grid; gap: 14px; }
.p-card { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 16px; }
.p-card-top { display: flex; gap: 12px; }
.p-card-top .thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 12px; flex: none; }
.p-card-info { display: grid; gap: 3px; min-width: 0; }
.p-card-price { font-weight: 800; }
.p-card-cat { color: var(--muted); font-size: .8rem; }
.p-card-tags { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 12px 0; }
.p-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.p-card-actions .secondary-button { padding: 10px 12px; font-size: .9rem; }

@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
  .group-grid, .advanced-grid { grid-template-columns: 1fr; }
  /* Uzoq forma: action tugmalari mobil ekranda sticky footer. */
  .product-form .form-buttons {
    position: sticky; bottom: 0; z-index: 5;
    background: var(--bg); padding: 12px 0; margin: 0 -2px;
    border-top: 1px solid var(--line);
  }
  .product-form .form-buttons .primary-button,
  .product-form .form-buttons .secondary-button { flex: 1; }
}
</style>
