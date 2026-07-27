<script setup lang="ts">
// Admin bo‘limlari navigatsiyasi. Bir manba — ikki ko‘rinishda ishlatiladi:
//  - variant="side"   → keng ekrandagi chap yon panel (icon + to‘liq yorliq)
//  - variant="bottom" → mobil ekrandagi pastki panel (icon + qisqa yorliq)
const props = withDefaults(
  defineProps<{ newOrders?: number, variant?: 'side' | 'bottom' }>(),
  { newOrders: 0, variant: 'side' }
)

const links = [
  { to: '/admin', label: 'Mahsulotlar', short: 'Mahsulot', icon: 'fa-box', exact: true },
  { to: '/admin/orders', label: 'Buyurtmalar', short: 'Buyurtma', icon: 'fa-receipt', exact: false, badge: true },
  { to: '/admin/categories', label: 'Kategoriyalar', short: 'Bo‘limlar', icon: 'fa-tags', exact: false },
  { to: '/admin/settings', label: 'Sozlamalar', short: 'Sozlama', icon: 'fa-gear', exact: false }
]

const route = useRoute()
const isActive = (link: { to: string, exact: boolean }) =>
  link.exact ? route.path === link.to : route.path.startsWith(link.to)
</script>

<template>
  <nav class="admin-nav" :class="`admin-nav--${props.variant}`" aria-label="Admin bo‘limlari">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="admin-nav-link"
      :class="{ active: isActive(link) }"
    >
      <span class="nav-icon">
        <i class="fa-solid" :class="link.icon" aria-hidden="true"></i>
        <span v-if="link.badge && props.newOrders > 0" class="nav-badge">{{ props.newOrders > 99 ? '99+' : props.newOrders }}</span>
      </span>
      <span class="nav-label">{{ props.variant === 'bottom' ? link.short : link.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.admin-nav { display: flex; gap: 4px; }

/* --- Chap yon panel: vertikal ro‘yxat --- */
.admin-nav--side { flex-direction: column; gap: 4px; }
.admin-nav--side .admin-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid transparent;
  transition: background .15s ease, color .15s ease;
}
.admin-nav--side .admin-nav-link:hover { color: var(--ink); background: var(--bg); }
.admin-nav--side .admin-nav-link.active {
  color: var(--accent-dark);
  background: #f2e9db;
}
.admin-nav--side .nav-icon { position: relative; width: 22px; text-align: center; font-size: 1.02rem; }
.admin-nav--side .nav-label { font-size: .95rem; }

/* --- Pastki panel (mobil): teng ustunlar --- */
.admin-nav--bottom { justify-content: space-around; gap: 0; }
.admin-nav--bottom .admin-nav-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px 6px;
  color: var(--muted);
  font-weight: 700;
  min-height: 54px;
  justify-content: center;
}
.admin-nav--bottom .admin-nav-link.active { color: var(--accent-dark); }
.admin-nav--bottom .admin-nav-link.active .nav-icon { transform: translateY(-1px); }
.admin-nav--bottom .nav-icon { position: relative; font-size: 1.18rem; }
.admin-nav--bottom .nav-label { font-size: .68rem; letter-spacing: .01em; }
.admin-nav--bottom .admin-nav-link.active .nav-label { font-weight: 800; }

/* --- Yangi buyurtmalar badge (ikkala ko‘rinishda) --- */
.nav-badge {
  position: absolute;
  top: -7px;
  right: -11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #8f1d1d;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1;
  border: 2px solid var(--surface);
}
.admin-nav--bottom .nav-badge { border-color: var(--surface); top: -6px; right: -10px; }
</style>
