<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'

interface BusinessMe {
  id: number
  name: string
  slug: string
  logo_url: string | null
  phone: string | null
  telegram_username: string | null
  whatsapp: string | null
  instagram: string | null
  address: string | null
  description: string | null
  is_active: boolean
  notify_telegram_chat_id: number | null
}

interface SettingsForm {
  name: string
  phone: string
  address: string
  telegram_username: string
  whatsapp: string
  instagram: string
  description: string
  logo_url: string
  notify_telegram_chat_id: number | null
}

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { token, signOut } = useAdminAuth()
const { resolveMediaUrl } = useMedia()

// Admin sahifalari qidiruv tizimlariga tushmasligi kerak.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const business = ref<BusinessMe | null>(null)
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const errorMessage = ref('')

const emptyForm = (): SettingsForm => ({
  name: '',
  phone: '',
  address: '',
  telegram_username: '',
  whatsapp: '',
  instagram: '',
  description: '',
  logo_url: '',
  notify_telegram_chat_id: null
})
const form = reactive<SettingsForm>(emptyForm())

// Saqlanmagan o‘zgarishlar himoyasi: joriy holatni oxirgi saqlangan nusxa bilan solishtiramiz.
const snapshot = ref('')
const dirty = computed(() => snapshot.value !== '' && snapshot.value !== JSON.stringify(form))
const takeSnapshot = () => { snapshot.value = JSON.stringify(form) }

// Logo ko‘rinishi: kiritilgan URL yoki mavjud `/uploads/...` media yo‘li.
const logoPreview = computed(() => resolveMediaUrl(form.logo_url.trim()) || '')

const resetMessages = () => { message.value = ''; errorMessage.value = '' }

const handleError = (error: any, fallback: string) => {
  if (isUnauthorized(error)) { signOut(); business.value = null; return }
  errorMessage.value = adminErrorMessage(error, fallback)
}

const fillForm = (data: BusinessMe) => {
  Object.assign(form, {
    name: data.name,
    phone: data.phone ?? '',
    address: data.address ?? '',
    telegram_username: data.telegram_username ?? '',
    whatsapp: data.whatsapp ?? '',
    instagram: data.instagram ?? '',
    description: data.description ?? '',
    logo_url: data.logo_url ?? '',
    notify_telegram_chat_id: data.notify_telegram_chat_id
  })
  takeSnapshot()
}

const loadMe = async () => {
  if (!token.value) return
  loading.value = true
  try {
    const data = await api<BusinessMe>('/admin/me')
    business.value = data
    fillForm(data)
  } catch (e: any) {
    handleError(e, 'Sozlamalarni yuklab bo‘lmadi.')
  } finally {
    loading.value = false
  }
}

/** Bo‘sh matnni `null`ga aylantiramiz — backend nullable maydonni shu bilan tozalaydi. */
const orNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
const numOrNull = (value: number | null) => {
  if (value === null || (value as unknown) === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const save = async () => {
  if (saving.value) return
  saving.value = true
  resetMessages()
  const payload = {
    name: form.name.trim(),
    phone: orNull(form.phone),
    address: orNull(form.address),
    telegram_username: orNull(form.telegram_username),
    whatsapp: orNull(form.whatsapp),
    instagram: orNull(form.instagram),
    description: orNull(form.description),
    logo_url: orNull(form.logo_url),
    notify_telegram_chat_id: numOrNull(form.notify_telegram_chat_id)
  }
  try {
    const data = await api<BusinessMe>('/admin/me', { method: 'PATCH', body: payload })
    business.value = data
    fillForm(data)
    message.value = 'Sozlamalar saqlandi.'
  } catch (e: any) {
    handleError(e, 'Saqlashda xato.')
  } finally {
    saving.value = false
  }
}

// Saqlanmagan o‘zgarishlar bilan sahifadan chiqishga urinilsa ogohlantiramiz.
const UNSAVED = 'Saqlanmagan o‘zgarishlar mavjud. Sahifadan chiqilsinmi?'
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm(UNSAVED)) return false
})
const onBeforeUnload = (e: BeforeUnloadEvent) => { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => {
  loadMe()
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <main class="admin-content">
    <header class="admin-header">
      <div>
        <span class="eyebrow">Boshqaruv</span>
        <h1>Sozlamalar</h1>
        <p>Do‘kon ma’lumotlari, aloqa va bildirishnomalar.</p>
      </div>
    </header>

    <p v-if="loading" class="empty">Yuklanmoqda…</p>

    <form v-else-if="business" class="admin-form settings-form" @submit.prevent="save">
      <!-- Faqat o‘qish uchun: slug va holat super admin tomonidan boshqariladi. -->
      <div class="readonly-row wide">
        <div class="readonly-field">
          <span class="readonly-label">Slug (o‘zgartirib bo‘lmaydi)</span>
          <span class="readonly-value">{{ business.slug }}</span>
        </div>
        <div class="readonly-field">
          <span class="readonly-label">Holat (o‘zgartirib bo‘lmaydi)</span>
          <span class="badge" :class="business.is_active ? 'badge-ok' : 'badge-off'">
            {{ business.is_active ? 'Faol' : 'Faol emas' }}
          </span>
        </div>
        <small class="hint">Slug va holatni faqat super admin o‘zgartira oladi.</small>
      </div>

      <h2 class="section-title wide">Do‘kon ma’lumotlari</h2>
      <label>Do‘kon nomi<input v-model.trim="form.name" required minlength="2" maxlength="160"></label>
      <label class="wide">Tavsif<textarea v-model.trim="form.description" rows="3"></textarea></label>
      <div class="logo-field wide">
        <label class="logo-input">Logotip (URL yoki media yo‘li)
          <input v-model.trim="form.logo_url" maxlength="500" placeholder="https://… yoki /uploads/…">
        </label>
        <div v-if="logoPreview" class="logo-preview">
          <img :src="logoPreview" alt="Logotip ko‘rinishi">
        </div>
      </div>

      <h2 class="section-title wide">Aloqa</h2>
      <label>Telefon<input v-model.trim="form.phone" maxlength="40" placeholder="+998 90 123 45 67"></label>
      <label class="wide">Manzil<input v-model.trim="form.address" maxlength="300"></label>
      <label>Telegram username<input v-model.trim="form.telegram_username" maxlength="80" placeholder="do‘kon_nomi"></label>
      <label>WhatsApp<input v-model.trim="form.whatsapp" maxlength="40" placeholder="+998 90 123 45 67"></label>
      <label>Instagram<input v-model.trim="form.instagram" maxlength="80" placeholder="do‘kon_nomi"></label>

      <h2 class="section-title wide">Bildirishnomalar</h2>
      <label class="wide">Telegram chat ID
        <input v-model.number="form.notify_telegram_chat_id" type="number" inputmode="numeric" placeholder="Masalan: 123456789">
        <small class="hint">Yangi buyurtmalar Telegramga kelishi uchun chat ID kiriting.</small>
      </label>

      <p v-if="message" class="notice wide" role="status">{{ message }}</p>
      <p v-if="errorMessage" class="error-message wide" role="alert">{{ errorMessage }}</p>

      <div class="form-buttons wide">
        <button class="primary-button" type="submit" :disabled="saving || !dirty">
          {{ saving ? 'Saqlanmoqda…' : 'Saqlash' }}
        </button>
        <span v-if="dirty" class="dirty-hint">Saqlanmagan o‘zgarishlar bor</span>
      </div>
    </form>
  </main>
</template>

<style scoped>
.settings-form { grid-template-columns: repeat(2, 1fr); }
.section-title { font-size: 1rem; margin: 8px 0 0; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }

.readonly-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 18px;
  background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 14px 18px;
}
.readonly-field { display: grid; gap: 4px; }
.readonly-label { font-size: .72rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.readonly-value { font-weight: 800; font-family: monospace; }
.readonly-row .hint { color: var(--muted); }

.logo-field { display: grid; gap: 12px; }
.logo-input { display: grid; gap: 6px; font-weight: 700; }
.logo-preview img {
  width: 120px; height: 120px; object-fit: contain;
  border-radius: 14px; border: 1px solid var(--line); background: var(--bg); padding: 8px;
}

.form-buttons { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.dirty-hint { color: var(--accent-dark); font-weight: 700; font-size: .85rem; }
.badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
.badge-ok { background: #e8f3ed; color: var(--success); }
.badge-off { background: #f3e2e2; color: #a32323; }
.empty { color: var(--muted); text-align: center; padding: 24px; }

@media (max-width: 640px) {
  .settings-form { grid-template-columns: 1fr; }
}
</style>
