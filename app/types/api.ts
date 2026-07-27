/**
 * Backend `schemas/catalog.py` bilan qo‘lda sinxronlanadigan TypeScript typelar.
 *
 * Bu yagona manba: sahifalar bu typelarni takrorlamasdan shu yerdan import qiladi.
 * Backend javob sxemasi o‘zgarsa — shu fayl ham yangilanadi (OpenAPI codegen ishlatilmaydi).
 * Narxlar backenddan **string** (Decimal) sifatida keladi.
 */

export type Availability = 'in_stock' | 'preorder' | 'out_of_stock'
export type OrderStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled'

export interface Category {
  id: number
  name: string
  slug: string
  position: number
  is_active: boolean
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string | null
  price: string
  old_price?: string | null
  material?: string | null
  dimensions?: string | null
  color?: string | null
  sku?: string | null
  image_url?: string | null
  availability: Availability
  position: number
  is_visible: boolean
  category?: Category | null
}

export interface ImportRowError {
  row: number
  message: string
}

export interface ImportResult {
  created: number
  skipped: number
  errors: ImportRowError[]
}

export interface Business {
  id: number
  name: string
  slug: string
  logo_url?: string | null
  phone?: string | null
  telegram_username?: string | null
  whatsapp?: string | null
  instagram?: string | null
  address?: string | null
  description?: string | null
  categories: Category[]
}

export interface Catalog {
  business: Business
  products: Product[]
  total: number
  limit: number
  offset: number
}

export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: string
  line_total: string
}

export interface Order {
  id: number
  customer_name: string
  customer_phone: string
  comment?: string | null
  status: OrderStatus
  source: string
  created_at: string
  notified_at?: string | null
  items: OrderItem[]
  total: string
}

export interface OrderList {
  orders: Order[]
  total: number
  limit: number
  offset: number
}

export interface SourceCount {
  source: string
  visits: number
}

export interface DayStat {
  date: string
  visits: number
  orders: number
}

export interface TopProduct {
  id: number
  name: string
  slug: string
  visits: number
}

export interface Stats {
  days: number
  total_visits: number
  total_orders: number
  total_products: number
  new_orders: number
  by_source: SourceCount[]
  by_day: DayStat[]
  top_products: TopProduct[]
}
