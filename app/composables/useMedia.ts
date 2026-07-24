/**
 * Media URL yordamchisi.
 *
 * Backend rasm yo‘llarini nisbiy (`/uploads/...`) qaytaradi. Ularni ko‘rsatish uchun
 * `NUXT_PUBLIC_MEDIA_BASE` bilan to‘ldiramiz. Tashqi (absolute) URL'lar o‘zgarmaydi.
 */
export const useMedia = () => {
  const config = useRuntimeConfig()
  const base = config.public.mediaBase as string

  const resolveMediaUrl = (path?: string | null): string => {
    if (!path) return ''
    if (/^https?:\/\//i.test(path)) return path
    if (path.startsWith('/uploads/')) return `${base}${path}`
    return path
  }

  return { resolveMediaUrl }
}
