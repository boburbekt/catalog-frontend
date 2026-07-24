<script setup lang="ts">
interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  slug: string
  price: string | number
  old_price?: string | number | null
  image_url?: string | null
  availability: string
  category?: Category | null
}

const props = defineProps<{
  product: Product
  shopSlug: string
}>()

const { resolveMediaUrl } = useMedia()

const money = (value: string | number) =>
  new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'
</script>

<template>
  <NuxtLink :to="`/${props.shopSlug}/product/${props.product.slug}`" class="product-card">
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
