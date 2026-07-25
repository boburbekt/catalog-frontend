import type { Availability, OrderStatus } from '~/types/api'

/**
 * Umumiy formatlash helperlari (Nuxt tomonidan avtomatik import qilinadi).
 * Sahifalar bu funksiyalarni takrorlamasdan shu yerdan foydalanadi.
 * Media URL resolver alohida `useMedia()` composable'ida (runtimeConfig kerak).
 */

/** Narxni o‘zbekcha formatda `so‘m` bilan: `4 850 000 so‘m`. */
export const money = (value: string | number): string =>
  new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'

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
