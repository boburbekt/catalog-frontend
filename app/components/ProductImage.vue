<script setup lang="ts">
/**
 * Mahsulot rasmi + ichki fallback.
 *
 * Real `image_url` bo‘lsa o‘sha ko‘rsatiladi. Ichki placeholder (mebel ikonasi +
 * “Rasm mavjud emas”) faqat: URL bo‘sh bo‘lsa YOKI rasm `error` bilan ochilmasa.
 * Tashqi placeholder servisiga (placehold.co va h.k.) so‘rov yuborilmaydi.
 *
 * Xato holati har komponent nusxasida alohida (`failed`) — bitta mahsulot rasmi
 * ochilmasa boshqa kartochkalarga ta’sir qilmaydi.
 */
const props = defineProps<{
  src?: string | null
  alt?: string
}>()

const { resolveMediaUrl } = useMedia()
const failed = ref(false)

const resolved = computed(() => resolveMediaUrl(props.src))
// Yangi URL kelsa (masalan boshqa mahsulot yoki rasm yangilangach) xato holati tozalanadi.
watch(resolved, () => { failed.value = false })

const showImage = computed(() => !!resolved.value && !failed.value)
</script>

<template>
  <img
    v-if="showImage"
    :src="resolved"
    :alt="alt || ''"
    loading="lazy"
    @error="failed = true"
  >
  <div v-else class="product-image-ph" role="img" :aria-label="alt || 'Rasm mavjud emas'">
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <!-- Oddiy divan (mebel) ikonasi -->
      <path
        d="M10 27v-6a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v6"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
      />
      <path
        d="M6 33v-3a3 3 0 0 1 3-3 3 3 0 0 1 3 3v3h24v-3a3 3 0 0 1 3-3 3 3 0 0 1 3 3v3a3 3 0 0 1-3 3v3M9 36a3 3 0 0 1-3-3M9 36v3"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
      />
    </svg>
    <span>Rasm mavjud emas</span>
  </div>
</template>

<style scoped>
.product-image-ph {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #e7e0d5;
  color: #6c675e;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  padding: 8px;
}
.product-image-ph svg {
  width: 34%;
  max-width: 52px;
  min-width: 24px;
  height: auto;
  opacity: 0.6;
}
</style>
