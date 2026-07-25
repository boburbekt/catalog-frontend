<script setup lang="ts">
import { ref, watch } from 'vue'
/**
 * Barcha admin sahifalari uchun yagona layout.
 *
 * - Login gate: token bo‘lmasa faqat kirish formasi ko‘rinadi (sahifalar login mantig‘ini takrorlamaydi).
 * - Bir xil topbar (brend + Chiqish) va navigatsiya (AdminNav) hamma sahifada.
 * - 401 kelganda sahifadagi xato handleri tokenni tozalaydi → shu layout darrov login formasiga qaytadi.
 * - Yangi buyurtmalar soni navigatsiyada badge sifatida ko‘rsatiladi.
 */
const { token, signIn, signOut } = useAdminAuth()
const api = useAdminApi()

const tokenInput = ref('')
const authError = ref('')
const signingIn = ref(false)

const onSignIn = async () => {
  authError.value = ''
  if (!signIn(tokenInput.value)) return
  tokenInput.value = ''
}

// Yangi buyurtmalar soni — nav badge uchun. Barcha admin sahifalar bo‘ylab bir marta o‘qiladi.
const newOrders = useState<number>('admin-new-orders', () => 0)
const refreshNewOrders = async () => {
  if (!token.value) return
  try {
    const stats = await api<{ new_orders: number }>('/admin/stats', { query: { days: 30 } })
    newOrders.value = stats.new_orders ?? 0
  } catch {
    // Badge — ikkilamchi ma’lumot; yuklanmasa sahifa baribir ishlaydi.
  }
}

watch(token, (value:any) => { if (value) refreshNewOrders() }, { immediate: true })
</script>

<template>
  <div class="admin-shell shell">
    <div class="admin-topbar">
      <NuxtLink to="/admin" class="admin-brand">
        <span class="eyebrow">Boshqaruv paneli</span>
        <strong>Mebel Catalog</strong>
      </NuxtLink>
      <button v-if="token" type="button" class="secondary-button" @click="signOut">Chiqish</button>
    </div>

    <template v-if="token">
      <AdminNav :new-orders="newOrders" />
      <slot />
    </template>

    <section v-else class="login-card">
      <span class="eyebrow">Kirish</span>
      <h1>Boshqaruv paneli</h1>
      <p>Do‘koningizning admin tokenini kiriting.</p>
      <form class="login-form" @submit.prevent="onSignIn">
        <label class="sr-label" for="admin-token">Admin token</label>
        <input
          id="admin-token"
          v-model.trim="tokenInput"
          type="password"
          autocomplete="current-password"
          placeholder="Admin token"
          required
        >
        <button class="primary-button" type="submit" :disabled="signingIn">Kirish</button>
      </form>
      <p v-if="authError" class="error-message" role="alert">{{ authError }}</p>
    </section>
  </div>
</template>

<style scoped>
.admin-shell { padding-block: 24px 80px; }

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
}
.admin-brand { display: grid; gap: 2px; }
.admin-brand strong { font-size: 1.25rem; }

.login-card {
  max-width: 420px;
  margin: 48px auto;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 32px;
  text-align: center;
}
.login-card h1 { font-size: 1.8rem; margin: 8px 0; }
.login-card p { color: var(--muted); margin: 0 0 20px; }
.login-form { display: grid; gap: 12px; }
.sr-label {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
</style>
