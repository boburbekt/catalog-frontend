/**
 * Admin API xatolarini foydalanuvchi tiliga o‘giradigan yordamchilar.
 * Texnik JSON yoki umumiy “Xato yuz berdi” o‘rniga tushunarli o‘zbekcha xabar qaytaramiz.
 */

/** 401 — token eskirgan yoki noto‘g‘ri. Layout buni ko‘rib login formasiga qaytadi. */
export const isUnauthorized = (error: any): boolean =>
  error?.status === 401 || error?.statusCode === 401 || error?.response?.status === 401

// Backend `detail` matnlarini yanada tushunarli / do‘stona variantga almashtiramiz.
const FRIENDLY_DETAIL: Record<string, string> = {
  'Bu slug allaqachon mavjud': 'Bu nom bilan yozuv allaqachon mavjud. Nomni biroz o‘zgartiring.',
  'Kategoriya topilmadi': 'Kategoriya topilmadi. Boshqa kategoriyani tanlang.'
}

/**
 * Xatodan foydalanuvchiga ko‘rsatiladigan matnni chiqaradi.
 * - tarmoq uzilishi (javob umuman yo‘q) → internet xabari;
 * - backend `detail` bo‘lsa → do‘stona ko‘rinishi yoki o‘zi;
 * - aks holda → `fallback`.
 */
export const adminErrorMessage = (
  error: any,
  fallback = 'Kutilmagan xatolik. Qayta urinib ko‘ring.'
): string => {
  const status = error?.status ?? error?.statusCode ?? error?.response?.status
  // Javob umuman kelmagan bo‘lsa (offline, DNS, CORS) — status aniqlanmaydi.
  if (status == null) {
    return 'Internet bilan aloqa uzildi. Qayta urinib ko‘ring.'
  }
  const detail = error?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return FRIENDLY_DETAIL[detail] ?? detail
  }
  return fallback
}
