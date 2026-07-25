<script setup lang="ts">
import type { Product } from '~/types/api'

const props = defineProps<{
  product: Product
  shopSlug: string
  source?: string
}>()

// Manba (QR/reklama) mahsulot havolasida saqlanadi — katalog → mahsulot → buyurtma bo‘yicha uziladi.
const to = computed(() => ({
  path: `/${props.shopSlug}/product/${props.product.slug}`,
  query: props.source ? { source: props.source } : {}
}))

const discount = computed(() => discountLabel(props.product.price, props.product.old_price))
</script>

<template>
  <NuxtLink :to="to" class="product-card">
    <div class="product-image-wrap">
      <ProductImage :src="props.product.image_url" :alt="props.product.name" class="product-image" />
      <AvailabilityBadge :availability="props.product.availability" class="card-availability" />
      <span v-if="discount" class="discount-badge">{{ discount }}</span>
    </div>
    <div class="product-card-body">
      <span class="eyebrow">{{ props.product.category?.name || 'Mebel' }}</span>
      <h3 class="product-name">{{ props.product.name }}</h3>
      <div class="price-row">
        <strong>{{ money(props.product.price) }}</strong>
        <del v-if="props.product.old_price">{{ money(props.product.old_price) }}</del>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
/* Kontrast: nom va joriy narx to‘q (--ink), kategoriya jigarrang (--accent-dark),
   eski narx kulrang (--muted). Hammasi och kartochka foni ustida WCAG AA. */
.product-card-body .eyebrow {
  color: var(--accent-dark);
}
.product-name {
  color: var(--ink);
  /* Nom ko‘pi bilan ikki qator. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price-row strong {
  color: var(--ink);
}
.price-row del {
  color: var(--muted);
}

.card-availability {
  position: absolute;
  left: 14px;
  top: 14px;
}
.discount-badge {
  position: absolute;
  right: 14px;
  top: 14px;
  background: #8f1d1d;
  color: #fff;
  border-radius: 999px;
  padding: 6px 11px;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
}
</style>
