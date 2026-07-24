<script setup lang="ts">
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

const api = useAdminApi()
const token = useAdminToken()
const { resolveMediaUrl } = useMedia()

const business = ref<BusinessMe | null>(null)
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const errorMessage = ref('')
const authError = ref('')
const tokenInput = ref('')

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

// Logo ko‘rinishi: kiritilgan URL yoki mavjud `/uploads/...` media yo‘li.
const logoPreview = computed(() => resolveMediaUrl(form.logo_url.trim()) || '')

const resetMessages = () => { message.value = ''; errorMessage.value = '' }

const handleError = (error: any, fallback: string) => {
  if (error?.status === 401 || error?.response?.status === 401) {
    token.value = null
    business.value = null
    authError.value = 'Token yaroqsiz. Qaytadan kiriting.'
    return
  }
  errorMessage.value = error?.data?.detail || fallback
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
}

const loadMe = async () => {
  if (!token.value) return
  loading.value = true
  try {
    const data = await api<BusinessMe>('/admin/me')
    business.value = data
    fillForm(data)
    authError.value = ''
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

const signIn = async () => {
  const value = tokenInput.value.trim()
  if (!value) return
  token.value = value
  tokenInput.value = ''
  authError.value = ''
  await loadMe()
}
const signOut = () => { token.value = null; business.value = null; authError.value = '' }

onMounted(loadMe)
</script>

<template>
  <main v-if="!token" class="admin-page shell">
    <section class="login-card">
      <span class="eyebrow">Boshqaruv paneli</span>
      <h1>Kirish</h1>
      <p>Do‘koningizning admin tokenini kiriting.</p>
      <form class="login-form" @submit.prevent="signIn">
        <input v-model.trim="tokenInput" type="password" autocomplete="current-password" placeholder="Admin token" required>
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
        <h1>Sozlamalar</h1>
        <p>Do‘kon ma’lumotlari, aloqa va ijtimoiy tarmoqlar.</p>
      </div>
      <div class="admin-actions">
        <button class="secondary-button" @click="signOut">Chiqish</button>
      </div>
    </header>

    <p v-if="loading" class="empty">Yuklanmoqda…</p>

    <form v-else-if="business" class="admin-form settings-form" @submit.prevent="save">
      <!-- Faqat o‘qish uchun: slug va holat super admin tomonidan boshqariladi. -->
      <div class="readonly-row wide">
        <div class="readonly-field">
          <span class="readonly-label">Slug</span>
          <span class="readonly-value">{{ business.slug }}</span>
        </div>
        <div class="readonly-field">
          <span class="readonly-label">Holat</span>
          <span class="badge" :class="business.is_active ? 'badge-ok' : 'badge-off'">
            {{ business.is_active ? 'Faol' : 'Faol emas' }}
          </span>
        </div>
        <small class="hint">Slug va holatni faqat super admin o‘zgartira oladi.</small>
      </div>

      <h2 class="section-title wide">Asosiy ma’lumotlar</h2>
      <label>Nomi<input v-model.trim="form.name" required minlength="2" maxlength="160"></label>
      <label>Telefon<input v-model.trim="form.phone" maxlength="40" placeholder="+998 90 123 45 67"></label>
      <label class="wide">Manzil<input v-model.trim="form.address" maxlength="300"></label>
      <label class="wide">Tavsif<textarea v-model.trim="form.description" rows="3"></textarea></label>

      <h2 class="section-title wide">Ijtimoiy tarmoqlar</h2>
      <label>Telegram username<input v-model.trim="form.telegram_username" maxlength="80" placeholder="do‘kon_nomi"></label>
      <label>Instagram<input v-model.trim="form.instagram" maxlength="80" placeholder="do‘kon_nomi"></label>
      <label>WhatsApp<input v-model.trim="form.whatsapp" maxlength="40" placeholder="+998 90 123 45 67"></label>

      <h2 class="section-title wide">Bildirishnoma</h2>
      <label>Telegram chat ID<input v-model.number="form.notify_telegram_chat_id" type="number" placeholder="Yangi buyurtmalar shu chatga yuboriladi"></label>

      <h2 class="section-title wide">Logotip</h2>
      <div class="logo-field wide">
        <label class="logo-input">Logo URL yoki media yo‘li
          <input v-model.trim="form.logo_url" maxlength="500" placeholder="https://… yoki /uploads/…">
        </label>
        <div v-if="logoPreview" class="logo-preview">
          <img :src="logoPreview" alt="Logo ko‘rinishi">
        </div>
      </div>

      <p v-if="message" class="notice wide">{{ message }}</p>
      <p v-if="errorMessage" class="error-message wide">{{ errorMessage }}</p>

      <div class="form-buttons wide">
        <button class="primary-button" :disabled="saving">
          {{ saving ? 'Saqlanmoqda…' : 'Saqlash' }}
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.login-card {
  max-width: 420px; margin: 60px auto; background: var(--surface);
  border: 1px solid var(--line); border-radius: 22px; padding: 32px; text-align: center;
}
.login-card h1 { font-size: 2rem; margin: 8px 0; }
.login-card p { color: var(--muted); margin: 0 0 20px; }
.login-form { display: grid; gap: 12px; }

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

.form-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
.badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
.badge-ok { background: #e8f3ed; color: var(--success); }
.badge-off { background: #f3e2e2; color: #a32323; }
.empty { color: var(--muted); text-align: center; padding: 24px; }

@media (max-width: 640px) {
  .settings-form { grid-template-columns: 1fr; }
}
</style>
