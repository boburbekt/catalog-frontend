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
  out_of_stock: 'Tugagan'
}

export const availabilityLabel = (value: string): string =>
  AVAILABILITY_LABELS[value as Availability] ?? value

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Yangi',
  contacted: 'Bog‘lanildi',
  confirmed: 'Tasdiqlangan',
  cancelled: 'Bekor qilingan'
}

export const orderStatusLabel = (value: string): string =>
  ORDER_STATUS_LABELS[value as OrderStatus] ?? value
