<script setup lang="ts">
// Admin bo‘limlari uchun umumiy navigatsiya. Aktiv bo‘lim ajralib turadi.
const props = withDefaults(defineProps<{ newOrders?: number }>(), { newOrders: 0 })

const links = [
  { to: '/admin', label: 'Mahsulotlar', icon: 'fa-couch', exact: true },
  { to: '/admin/orders', label: 'Buyurtmalar', icon: 'fa-receipt', exact: false, badge: true },
  { to: '/admin/categories', label: 'Kategoriyalar', icon: 'fa-tags', exact: false },
  { to: '/admin/settings', label: 'Sozlamalar', icon: 'fa-gear', exact: false }
]

const route = useRoute()
const isActive = (link: { to: string, exact: boolean }) =>
  link.exact ? route.path === link.to : route.path.startsWith(link.to)
</script>

<template>
  <nav class="admin-nav" aria-label="Admin bo‘limlari">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="admin-nav-link"
      :class="{ active: isActive(link) }"
    >
      <i class="fa-solid" :class="link.icon" aria-hidden="true"></i>
      <span>{{ link.label }}</span>
      <span v-if="link.badge && props.newOrders > 0" class="nav-badge">{{ props.newOrders }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.admin-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
  /* Mobil: gorizontal scroll — bo‘limlar sig‘masa surib ko‘riladi. */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.admin-nav::-webkit-scrollbar { display: none; }
.admin-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  padding: 9px 16px;
  border-radius: 999px;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid transparent;
}
.admin-nav-link:hover { color: var(--ink); background: var(--surface); }
.admin-nav-link.active {
  color: var(--ink);
  background: var(--surface);
  border-color: var(--line);
}
.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #8f1d1d;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}
</style>
