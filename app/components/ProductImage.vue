<script setup lang="ts">
/**
 * Mahsulot rasmi + ichki fallback.
 *
 * Real `image_url` bo‘lsa o‘sha ko‘rsatiladi. Ichki placeholder (rasm ikonasi +
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
    <i class="fa-regular fa-image" aria-hidden="true"></i>
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
  /* Ikonka konteyner o‘lchamiga qarab kattalashsin (thumbnaildan katta rasmgacha). */
  container-type: size;
}
.product-image-ph i {
  font-size: clamp(1.2rem, 32cqmin, 2.6rem);
  line-height: 1;
  opacity: 0.55;
}
</style>
