<script setup lang="ts">
// Availability badge — matn va rang yagona `availabilityBadge()` helperidan keladi.
// ProductCard ham, mahsulot detali ham shu komponentni ishlatadi (if/else takrorlanmaydi).
const props = defineProps<{ availability: string }>()
const badge = computed(() => availabilityBadge(props.availability))

// Har bir holat uchun ikonka — matn bilan birga ma'noni tezroq yetkazadi.
const ICONS: Record<string, string> = {
  in_stock: 'fa-circle-check',
  preorder: 'fa-clock',
  out_of_stock: 'fa-circle-xmark'
}
const icon = computed(() => ICONS[badge.value.variant] ?? 'fa-circle-info')
</script>

<template>
  <span class="availability-badge" :class="`availability-badge--${badge.variant}`">
    <i class="fa-solid" :class="icon" aria-hidden="true"></i>
    {{ badge.label }}
  </span>
</template>

<style scoped>
.availability-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}
/* Kontrast WCAG AA: to‘q matn och fon ustida. */
.availability-badge--in_stock {
  background: #dcefe4;
  color: #0f5132; /* yashil, ~7:1 */
}
.availability-badge--preorder {
  background: #f0e6d8;
  color: #6d4a27; /* jigarrang (brand accent-dark), ~6:1 */
}
.availability-badge--out_of_stock {
  background: #f6dede;
  color: #8f1d1d; /* qizil, ~6:1 */
}
</style>
