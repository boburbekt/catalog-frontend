<script setup lang="ts">
// Admin bo‘limlari uchun umumiy navigatsiya. Kategoriyalar va Sozlamalar keyingi bosqichlarda ulanadi.
const links = [
  { to: '/admin', label: 'Mahsulotlar', exact: true },
  { to: '/admin/orders', label: 'Buyurtmalar', exact: false },
  { to: '/admin/categories', label: 'Kategoriyalar', exact: false },
  { to: '/admin/settings', label: 'Sozlamalar', exact: false }
]

const route = useRoute()
const isActive = (link: { to: string, exact: boolean }) =>
  link.exact ? route.path === link.to : route.path.startsWith(link.to)
</script>

<template>
  <nav class="admin-nav">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="admin-nav-link"
      :class="{ active: isActive(link) }"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.admin-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
}
.admin-nav-link {
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
</style>
