<script setup lang="ts">
import { ref, computed, watch } from 'vue'
/**
 * Barcha admin sahifalari uchun yagona app-shell layout.
 *
 * - Login gate: token bo‘lmasa faqat kirish formasi ko‘rinadi.
 * - Keng ekran: chap yon panel (brend + navigatsiya + do‘kon havolasi + chiqish).
 * - Mobil ekran: yuqorida ixcham topbar, pastda tab-bar navigatsiya.
 * - 401 kelganda sahifadagi xato handleri tokenni tozalaydi → shu layout darrov login formasiga qaytadi.
 * - Yangi buyurtmalar soni navigatsiyada badge sifatida ko‘rsatiladi.
 */
const { token, signIn, signOut } = useAdminAuth()
const api = useAdminApi()
const { resolveMediaUrl } = useMedia()

const tokenInput = ref('')
const authError = ref('')
const signingIn = ref(false)

const onSignIn = async () => {
  authError.value = ''
  if (!signIn(tokenInput.value)) return
  tokenInput.value = ''
}

// Yangi buyurtmalar soni — nav badge uchun.
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

// Do‘kon nomi/logotipi/slug — yon paneldagi brend va "Do‘konni ko‘rish" havolasi uchun.
const shop = useState<{ name: string, slug: string, logo_url: string | null } | null>('admin-shop', () => null)
const shopLogo = computed(() => (shop.value?.logo_url ? resolveMediaUrl(shop.value.logo_url) : ''))
const loadShop = async () => {
  if (!token.value) return
  try {
    shop.value = await api<{ name: string, slug: string, logo_url: string | null }>('/admin/me')
  } catch {
    // Brend ma’lumoti ikkilamchi — yuklanmasa "Mini Katalog" ko‘rinadi.
  }
}

watch(token, (value) => {
  if (value) { refreshNewOrders(); loadShop() }
  else { shop.value = null; newOrders.value = 0 }
}, { immediate: true })
</script>

<template>
  <!-- Kirilgan holat: to‘liq app-shell -->
  <div v-if="token" class="admin-app">
    <aside class="admin-sidebar">
      <NuxtLink to="/admin" class="side-brand">
        <img v-if="shopLogo" :src="shopLogo" alt="" class="side-logo">
        <span v-else class="side-logo side-logo--ph"><i class="fa-solid fa-store" aria-hidden="true"></i></span>
        <span class="side-brand-text">
          <small>Boshqaruv paneli</small>
          <strong>{{ shop?.name || 'Mini Katalog' }}</strong>
        </span>
      </NuxtLink>

      <AdminNav :new-orders="newOrders" variant="side" />

      <div class="side-foot">
        <a
          v-if="shop?.slug"
          :href="`/${shop.slug}`"
          target="_blank"
          rel="noopener"
          class="side-link"
        ><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Do‘konni ko‘rish</a>
        <button type="button" class="side-link side-signout" @click="signOut">
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Chiqish
        </button>
      </div>
    </aside>

    <div class="admin-main">
      <!-- Mobil topbar (yon panel yashiringanda) -->
      <div class="mobile-topbar">
        <NuxtLink to="/admin" class="mtop-brand">
          <img v-if="shopLogo" :src="shopLogo" alt="" class="mtop-logo">
          <strong>{{ shop?.name || 'Mini Katalog' }}</strong>
        </NuxtLink>
        <div class="mtop-actions">
          <a
            v-if="shop?.slug"
            :href="`/${shop.slug}`"
            target="_blank"
            rel="noopener"
            class="icon-btn only-icon"
            title="Do‘konni ko‘rish"
            aria-label="Do‘konni ko‘rish"
          ><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
          <button type="button" class="icon-btn only-icon" title="Chiqish" aria-label="Chiqish" @click="signOut">
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="admin-page-wrap">
        <slot />
      </div>
    </div>

    <!-- Mobil pastki navigatsiya -->
    <div class="mobile-tabbar">
      <AdminNav :new-orders="newOrders" variant="bottom" />
    </div>
  </div>

  <!-- Chiqilgan holat: login -->
  <div v-else class="login-shell">
    <section class="login-card">
      <div class="login-icon"><i class="fa-solid fa-lock" aria-hidden="true"></i></div>
      <span class="eyebrow">Boshqaruv paneli</span>
      <h1>Xush kelibsiz</h1>
      <p>Davom etish uchun do‘koningizning admin tokenini kiriting.</p>
      <form class="login-form" @submit.prevent="onSignIn">
        <label class="sr-label" for="admin-token">Admin token</label>
        <div class="token-field">
          <i class="fa-solid fa-key" aria-hidden="true"></i>
          <input
            id="admin-token"
            v-model.trim="tokenInput"
            type="password"
            autocomplete="current-password"
            placeholder="Admin token"
            required
          >
        </div>
        <button class="primary-button full" type="submit" :disabled="signingIn"><i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i> Kirish</button>
      </form>
      <p v-if="authError" class="error-message" role="alert">{{ authError }}</p>
    </section>
  </div>
</template>

<style scoped>
/* ============ App-shell: sidebar + content ============ */
.admin-app {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--bg);
}

.admin-sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 16px;
  background: var(--surface);
  border-right: 1px solid var(--line);
}
.side-brand { display: flex; align-items: center; gap: 12px; padding: 6px 8px 4px; }
.side-logo {
  width: 42px; height: 42px; flex: none;
  object-fit: cover; border-radius: 12px; border: 1px solid var(--line);
}
.side-logo--ph {
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--ink); color: #fff; font-size: 1.05rem;
}
.side-brand-text { display: grid; gap: 1px; min-width: 0; }
.side-brand-text small {
  color: var(--muted); font-size: .68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
}
.side-brand-text strong {
  font-size: 1.05rem; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.side-foot { margin-top: auto; display: grid; gap: 4px; border-top: 1px solid var(--line); padding-top: 12px; }
.side-link {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 12px;
  background: none; border: 0; width: 100%; text-align: left;
  color: var(--muted); font-weight: 700; font-size: .92rem; cursor: pointer;
}
.side-link:hover { color: var(--ink); background: var(--bg); }
.side-signout:hover { color: #a32323; }

.admin-main { min-width: 0; display: flex; flex-direction: column; }
.admin-page-wrap {
  width: min(1080px, 100%);
  margin-inline: auto;
  padding: 26px clamp(16px, 4vw, 40px) 90px;
  flex: 1;
}

/* ============ Mobil topbar + tabbar (keng ekranda yashirin) ============ */
.mobile-topbar { display: none; }
.mobile-tabbar { display: none; }
.mtop-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.mtop-logo { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; flex: none; }
.mtop-brand strong { font-size: 1.05rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mtop-actions { display: flex; gap: 8px; flex: none; }

/* ============ Login ============ */
.login-shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--bg); }
.login-card {
  width: min(420px, 100%);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 36px 32px;
  text-align: center;
}
.login-card h1 { font-size: 1.7rem; margin: 10px 0 6px; }
.login-card > p { color: var(--muted); margin: 0 0 22px; }
.login-icon {
  display: flex; align-items: center; justify-content: center;
  width: 60px; height: 60px; margin: 0 auto 14px;
  border-radius: 18px; background: var(--ink); color: #fff; font-size: 1.4rem;
}
.login-form { display: grid; gap: 12px; }
.token-field { position: relative; }
.token-field i {
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  color: var(--muted); pointer-events: none;
}
.token-field input { width: 100%; padding-left: 42px; }
.sr-label {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* ============ Mobil (<900px): sidebar → topbar + bottom tabbar ============ */
@media (max-width: 900px) {
  .admin-app { grid-template-columns: 1fr; }
  .admin-sidebar { display: none; }

  .mobile-topbar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    position: sticky; top: 0; z-index: 20;
    padding: 12px clamp(16px, 4vw, 24px);
    background: var(--surface); border-bottom: 1px solid var(--line);
  }
  .admin-page-wrap { padding-bottom: 96px; }

  .mobile-tabbar {
    display: block;
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
    background: var(--surface);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -4px 18px rgb(24 22 18 / 6%);
  }
}
</style>
