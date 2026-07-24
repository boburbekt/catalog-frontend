<script setup lang="ts">
import type { Product } from '~/types/api'

const props = defineProps<{
  product: Product
  shopSlug: string
  source?: string
}>()

const { resolveMediaUrl } = useMedia()

// Manba (QR/reklama) mahsulot havolasida saqlanadi — katalog → mahsulot → buyurtma bo‘yicha uziladi.
const to = computed(() => ({
  path: `/${props.shopSlug}/product/${props.product.slug}`,
  query: props.source ? { source: props.source } : {}
}))
</script>

<template>
  <NuxtLink :to="to" class="product-card">
    <div class="product-image-wrap">
      <img
        :src="resolveMediaUrl(props.product.image_url) || 'https://placehold.co/800x600?text=Mebel'"
        :alt="props.product.name"
        class="product-image"
        loading="lazy"
      >
      <span v-if="props.product.availability === 'in_stock'" class="stock-badge">Mavjud</span>
    </div>
    <div class="product-card-body">
      <span class="eyebrow">{{ props.product.category?.name || 'Mebel' }}</span>
      <h3>{{ props.product.name }}</h3>
      <div class="price-row">
        <strong>{{ money(props.product.price) }}</strong>
        <del v-if="props.product.old_price">{{ money(props.product.old_price) }}</del>
      </div>
    </div>
  </NuxtLink>
</template>
