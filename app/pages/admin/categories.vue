<script setup lang="ts">
interface Category {
  id: number
  name: string
  slug: string
  position: number
  is_active: boolean
}

interface CategoryForm {
  name: string
  slug: string
  position: number
  is_active: boolean
}

const api = useApi()
const token = useAdminToken()

const categories = ref<Category[]>([])
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const busyId = ref<number | null>(null)
const message = ref('')
const errorMessage = ref('')
const authError = ref('')
const tokenInput = ref('')

const emptyForm = (): CategoryForm => ({ name: '', slug: '', position: 0, is_active: true })
const form = reactive<CategoryForm>(emptyForm())

const slugTouched = ref(false)
watch(() => form.name, (value) => {
  if (editingId.value !== null || slugTouched.value) return
  form.slug = value
    .toLowerCase().trim()
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
})

const resetMessages = () => { message.value = ''; errorMessage.value = '' }

const handleError = (error: any, fallback: string) => {
  if (error?.status === 401 || error?.response?.status === 401) {
    token.value = null
    categories.value = []
    authError.value = 'Token yaroqsiz. Qaytadan kiriting.'
    return
  }
  errorMessage.value = error?.data?.detail || fallback
}

const loadCategories = async () => {
  if (!token.value) return
  loading.value = true
  try {
    categories.value = await api<Category[]>('/admin/categories')
    authError.value = ''
  } catch (e: any) {
    handleError(e, 'Kategoriyalarni yuklab bo‘lmadi.')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  resetMessages()
  editingId.value = null
  slugTouched.value = false
  // Yangi kategoriya oxiriga qo‘shiladi.
  Object.assign(form, emptyForm(), {
    position: categories.value.length ? Math.max(...categories.value.map((c) => c.position)) + 1 : 0
  })
  showForm.value = true
}

const openEdit = (category: Category) => {
  resetMessages()
  editingId.value = category.id
  slugTouched.value = true
  Object.assign(form, {
    name: category.name, slug: category.slug,
    position: category.position, is_active: category.is_active
  })
  showForm.value = true
}

const closeForm = () => { showForm.value = false; editingId.value = null }

const saveCategory = async () => {
  saving.value = true
  resetMessages()
  const payload = {
    name: form.name.trim(),
    slug: form.slug.trim(),
    position: Number(form.position),
    is_active: form.is_active
  }
  try {
    if (editingId.value === null) {
      await api('/admin/categories', { method: 'POST', body: payload })
      message.value = 'Kategoriya qo‘shildi.'
    } else {
      await api(`/admin/categories/${editingId.value}`, { method: 'PATCH', body: payload })
      message.value = 'Kategoriya yangilandi.'
    }
    closeForm()
    await loadCategories()
  } catch (e: any) {
    handleError(e, 'Saqlashda xato.')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (category: Category) => {
  resetMessages()
  busyId.value = category.id
  try {
    await api(`/admin/categories/${category.id}`, {
      method: 'PATCH', body: { is_active: !category.is_active }
    })
    await loadCategories()
  } catch (e: any) {
    handleError(e, 'Holatni o‘zgartirib bo‘lmadi.')
  } finally {
    busyId.value = null
  }
}

const deleteCategory = async (category: Category) => {
  if (!window.confirm(`“${category.name}” o‘chirilsinmi? Mahsulotlar kategoriyasiz qoladi.`)) return
  resetMessages()
  busyId.value = category.id
  try {
    const result = await api<{ id: number, detached_products: number }>(
      `/admin/categories/${category.id}`, { method: 'DELETE' }
    )
    message.value = `${result.detached_products} ta mahsulot kategoriyasiz qoldi.`
    await loadCategories()
  } catch (e: any) {
    handleError(e, 'O‘chirishda xato.')
  } finally {
    busyId.value = null
  }
}

// Yuqoriga/pastga: qo‘shni kategoriya bilan position qiymatini almashtiramiz (drag-and-drop yo‘q).
const swapPosition = async (index: number, target: number) => {
  const a = categories.value[index]
  const b = categories.value[target]
  if (!a || !b) return
  resetMessages()
  busyId.value = a.id
  try {
    await api(`/admin/categories/${a.id}`, { method: 'PATCH', body: { position: b.position } })
    await api(`/admin/categories/${b.id}`, { method: 'PATCH', body: { position: a.position } })
    await loadCategories()
  } catch (e: any) {
    handleError(e, 'Tartibni o‘zgartirib bo‘lmadi.')
  } finally {
    busyId.value = null
  }
}
const moveUp = (index: number) => index > 0 && swapPosition(index, index - 1)
const moveDown = (index: number) => index < categories.value.length - 1 && swapPosition(index, index + 1)

const signIn = async () => {
  const value = tokenInput.value.trim()
  if (!value) return
  token.value = value
  tokenInput.value = ''
  authError.value = ''
  await loadCategories()
}
const signOut = () => { token.value = null; categories.value = []; authError.value = '' }

onMounted(loadCategories)
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
        <h1>Kategoriyalar</h1>
        <p>Katalog bo‘limlarini boshqaring va tartiblang.</p>
      </div>
      <div class="admin-actions">
        <button class="secondary-button" @click="signOut">Chiqish</button>
        <button class="primary-button" @click="openCreate">+ Kategoriya</button>
      </div>
    </header>

    <form v-if="showForm" class="admin-form cat-form" @submit.prevent="saveCategory">
      <div class="form-title wide">
        <strong>{{ editingId === null ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash' }}</strong>
        <button type="button" class="link-button" @click="closeForm">Bekor qilish</button>
      </div>
      <label>Nomi<input v-model.trim="form.name" required></label>
      <label>Slug<input v-model.trim="form.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required @input="slugTouched = true"></label>
      <label>Pozitsiya<input v-model.number="form.position" type="number" min="0"></label>
      <label class="checkbox-label"><input v-model="form.is_active" type="checkbox"> Faol (katalogda ko‘rinadi)</label>
      <div class="form-buttons wide">
        <button class="primary-button" :disabled="saving">
          {{ saving ? 'Saqlanmoqda…' : editingId === null ? 'Qo‘shish' : 'Yangilash' }}
        </button>
        <button type="button" class="secondary-button" @click="closeForm">Yopish</button>
      </div>
    </form>

    <p v-if="message" class="notice">{{ message }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <p v-if="loading" class="empty">Yuklanmoqda…</p>
    <p v-else-if="categories.length === 0" class="empty">Hozircha kategoriya yo‘q.</p>

    <ul v-else class="cat-list">
      <li v-for="(category, index) in categories" :key="category.id" class="cat-row" :class="{ inactive: !category.is_active }">
        <div class="cat-order">
          <button class="icon-button" :disabled="index === 0 || busyId === category.id" title="Yuqoriga" @click="moveUp(index)">▲</button>
          <span class="pos">{{ category.position }}</span>
          <button class="icon-button" :disabled="index === categories.length - 1 || busyId === category.id" title="Pastga" @click="moveDown(index)">▼</button>
        </div>
        <div class="cat-main">
          <strong>{{ category.name }}</strong>
          <small>{{ category.slug }}</small>
        </div>
        <span class="badge" :class="category.is_active ? 'badge-ok' : 'badge-off'">
          {{ category.is_active ? 'Faol' : 'Faol emas' }}
        </span>
        <div class="cat-actions">
          <button class="link-button" @click="openEdit(category)">Tahrirlash</button>
          <button class="link-button" :disabled="busyId === category.id" @click="toggleActive(category)">
            {{ category.is_active ? 'Faolsizlantirish' : 'Faollashtirish' }}
          </button>
          <button class="link-button danger" :disabled="busyId === category.id" @click="deleteCategory(category)">O‘chirish</button>
        </div>
      </li>
    </ul>
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

.form-title { display: flex; align-items: center; justify-content: space-between; }
.form-title strong { font-size: 1.1rem; }
.form-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
.cat-form { grid-template-columns: repeat(3, 1fr); }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.checkbox-label input { width: auto; }

.empty { color: var(--muted); text-align: center; padding: 24px; }
.link-button { background: none; border: 0; padding: 0; color: var(--accent-dark); font-weight: 700; text-decoration: underline; cursor: pointer; }
.link-button:disabled { opacity: .5; cursor: not-allowed; }
.link-button.danger { color: #a32323; }

.cat-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.cat-row {
  display: flex; align-items: center; gap: 16px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 14px 18px;
}
.cat-row.inactive { opacity: .62; }
.cat-order { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cat-order .pos { font-size: .75rem; color: var(--muted); }
.icon-button {
  border: 1px solid var(--line); background: var(--bg); border-radius: 8px;
  width: 28px; height: 22px; line-height: 1; font-size: .7rem; color: var(--ink);
}
.icon-button:disabled { opacity: .35; cursor: not-allowed; }
.cat-main { flex: 1; min-width: 0; display: grid; gap: 2px; }
.cat-main small { color: var(--muted); word-break: break-all; }
.cat-actions { display: flex; flex-wrap: wrap; gap: 14px; }

.badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
.badge-ok { background: #e8f3ed; color: var(--success); }
.badge-off { background: #f3e2e2; color: #a32323; }

@media (max-width: 640px) {
  .cat-form { grid-template-columns: 1fr; }
  .cat-row { flex-wrap: wrap; }
  .cat-actions { width: 100%; }
}
</style>
