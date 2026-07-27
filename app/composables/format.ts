import type { Availability, OrderStatus } from '~/types/api'

/**
 * Umumiy formatlash helperlari (Nuxt tomonidan avtomatik import qilinadi).
 * Sahifalar bu funksiyalarni takrorlamasdan shu yerdan foydalanadi.
 * Media URL resolver alohida `useMedia()` composable'ida (runtimeConfig kerak).
 */

/** Narxni o‘zbekcha formatda `so‘m` bilan: `4 850 000 so‘m`. */
export const money = (value: string | number): string =>
  new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'

/**
 * Summa inputi uchun jonli formatlash: faqat raqamlarni qoldirib, minglikni
 * bo‘sh joy bilan ajratadi (`4850000` → `4 850 000`). Kasr qismisiz — narxlar
 * so‘mda butun kiritiladi, `money()` ham kasr ko‘rsatmaydi.
 */
export const formatAmountInput = (raw: string | number | null | undefined): string => {
  const digits = String(raw ?? '').replace(/\D/g, '')
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
}

/** Formatlangan summani songa qaytaradi: `'4 850 000'` → `4850000`, bo‘sh → `null`. */
export const parseAmount = (formatted: string): number | null => {
  const digits = formatted.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

/**
 * Telefon raqamni jonli formatlash: `+998 90 123 45 67`.
 * Faqat raqamlarni oladi, `998` prefiksini bir marta qo‘yadi, 9 ta lokal
 * raqamgacha kesadi. Bo‘sh kiritilsa — bo‘sh qaytaradi (majburan +998 yozmaydi).
 */
export const formatPhone = (raw: string): string => {
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('998')) digits = digits.slice(3)
  digits = digits.slice(0, 9)
  let out = '+998'
  if (digits.length > 0) out += ' ' + digits.slice(0, 2)
  if (digits.length > 2) out += ' ' + digits.slice(2, 5)
  if (digits.length > 5) out += ' ' + digits.slice(5, 7)
  if (digits.length > 7) out += ' ' + digits.slice(7, 9)
  return out
}

const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'Mavjud',
  preorder: 'Buyurtma asosida',
  out_of_stock: 'Hozir mavjud emas'
}

export const availabilityLabel = (value: string): string =>
  AVAILABILITY_LABELS[value as Availability] ?? value

/**
 * Availability badge uchun yagona manba: matn + variant (rang).
 * ProductCard, mahsulot detali va admin sahifasi shu helperdan foydalanadi —
 * har sahifada if/else matn/rang takrorlanmaydi.
 *   in_stock     → yashil
 *   preorder     → jigarrang (brand)
 *   out_of_stock → qizil
 */
export const availabilityBadge = (value: string): { label: string, variant: Availability } => {
  const variant: Availability = value in AVAILABILITY_LABELS ? (value as Availability) : 'out_of_stock'
  return { label: AVAILABILITY_LABELS[variant], variant }
}

/**
 * Chegirma foizi: `old_price > price` bo‘lsagina butun songa yaxlitlab qaytaradi.
 * old_price yo‘q, `old_price <= price` yoki qiymatlar noto‘g‘ri bo‘lsa — `null` (badge chiqmaydi).
 */
export const discountPercent = (
  price: string | number,
  oldPrice?: string | number | null
): number | null => {
  if (oldPrice === null || oldPrice === undefined || oldPrice === '') return null
  const p = Number(price)
  const o = Number(oldPrice)
  if (!Number.isFinite(p) || !Number.isFinite(o) || o <= 0) return null
  if (o <= p) return null
  return Math.round(((o - p) / o) * 100)
}

/** Chegirma yorlig‘i: `−8%` (yoki chegirma yo‘q bo‘lsa `null`). */
export const discountLabel = (
  price: string | number,
  oldPrice?: string | number | null
): string | null => {
  const pct = discountPercent(price, oldPrice)
  return pct === null ? null : `−${pct}%`
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Yangi',
  contacted: 'Bog‘lanildi',
  confirmed: 'Tasdiqlangan',
  cancelled: 'Bekor qilingan'
}

export const orderStatusLabel = (value: string): string =>
  ORDER_STATUS_LABELS[value as OrderStatus] ?? value
