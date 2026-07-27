<script setup lang="ts">
import type { Order, OrderList, OrderStatus } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { token, signOut } = useAdminAuth()

// Admin sahifalari qidiruv tizimlariga tushmasligi kerak.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const orders = ref<Order[]>([])
const totalCount = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const message = ref('')
const errorMessage = ref('')

const statusFilter = ref('')
const daysFilter = ref('30')
const PAGE_SIZE = 20
const offset = ref(0)

const detail = ref<Order | null>(null)
const detailLoading = ref(false)
const busyId = ref<number | null>(null)

// Dropdown opsiyalari uchun (value + label); yorliqning o‘zi `orderStatusLabel()` helperidan.
const STATUSES: { value: OrderStatus, label: string }[] = [
  { value: 'new', label: orderStatusLabel('new') },
  { value: 'contacted', label: orderStatusLabel('contacted') },
  { value: 'confirmed', label: orderStatusLabel('confirmed') },
  { value: 'cancelled', label: orderStatusLabel('cancelled') }
]
const statusLabel = orderStatusLabel

const SOURCE_LABEL: Record<string, string> = {
  qr: 'QR', link: 'Havola', instagram: 'Instagram', telegram: 'Telegram', direct: 'To‘g‘ridan'
}
const sourceLabel = (value: string) => SOURCE_LABEL[value] ?? value

const hasMore = computed(() => orders.value.length < totalCount.value)
// money() — `~/composables/format.ts` dan avtomatik import qilinadi.

const formatDate = (value: string) =>
  new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

// Backend `days` 1–365 oralig‘ida; "Barchasi" eng katta oyna (365 kun) bilan ifodalanadi.
const daysParam = () => (daysFilter.value === 'all' ? 365 : Number(daysFilter.value))

const buildQuery = () => {
  const query: Record<string, string | number> = { days: daysParam(), limit: PAGE_SIZE, offset: offset.value }
  if (statusFilter.value) query.status = statusFilter.value
  return query
}

const handleError = (error: any, fallback: string) => {
  if (isUnauthorized(error)) { signOut(); orders.value = []; return }
  errorMessage.value = adminErrorMessage(error, fallback)
}

const loadOrders = async () => {
  if (!token.value) return
  loading.value = true
  offset.value = 0
  detail.value = null
  errorMessage.value = ''
  try {
    const data = await api<OrderList>('/admin/orders', { query: buildQuery() })
    orders.value = data.orders
    totalCount.value = data.total
  } catch (e: any) {
    handleError(e, 'Buyurtmalarni yuklab bo‘lmadi.')
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  offset.value += PAGE_SIZE
  try {
    const data = await api<OrderList>('/admin/orders', { query: buildQuery() })
    orders.value = orders.value.concat(data.orders)
    totalCount.value = data.total
  } catch (e: any) {
    handleError(e, 'Ko‘proq yuklab bo‘lmadi.')
  } finally {
    loadingMore.value = false
  }
}

const openDetail = async (order: Order) => {
  errorMessage.value = ''
  detailLoading.value = true
  detail.value = order
  try {
    detail.value = await api<Order>(`/admin/orders/${order.id}`)
  } catch (e: any) {
    handleError(e, 'Tafsilotlarni yuklab bo‘lmadi.')
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => { detail.value = null }

const changeStatus = async (order: Order, status: string) => {
  if (status === order.status) return
  busyId.value = order.id
  errorMessage.value = ''
  message.value = ''
  try {
    const updated = await api<Order>(`/admin/orders/${order.id}`, {
      method: 'PATCH',
      body: { status }
    })
    order.status = updated.status
    if (detail.value?.id === order.id) detail.value = updated
    message.value = `#${order.id} — holat “${statusLabel(status)}” ga o‘zgartirildi.`
  } catch (e: any) {
    handleError(e, 'Holatni o‘zgartirib bo‘lmadi.')
  } finally {
    busyId.value = null
  }
}

watch([statusFilter, daysFilter], loadOrders)
onMounted(loadOrders)
</script>

<template>
  <main class="admin-content">
    <header class="admin-header">
      <div>
        <span class="eyebrow">Boshqaruv</span>
        <h1>Buyurtmalar</h1>
        <p>Jami: {{ totalCount }} ta buyurtma (tanlangan filtr bo‘yicha).</p>
      </div>
    </header>

    <div class="filters">
      <label>Holat
        <select v-model="statusFilter">
          <option value="">Barchasi</option>
          <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </label>
      <label>Davr
        <select v-model="daysFilter">
          <option value="7">7 kun</option>
          <option value="30">30 kun</option>
          <option value="90">90 kun</option>
          <option value="all">Barchasi</option>
        </select>
      </label>
    </div>

    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

    <p v-if="loading" class="empty">Yuklanmoqda…</p>
    <p v-else-if="orders.length === 0" class="empty">Buyurtmalar topilmadi.</p>

    <!-- Keng ekran: jadval -->
    <section v-if="orders.length" class="admin-table-wrap desktop-only">
      <table class="admin-table">
        <thead>
          <tr><th>#</th><th>Mijoz</th><th>Manba</th><th>Sana</th><th>Jami</th><th>Bildirishnoma</th><th>Holat</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>
              <strong>{{ order.customer_name }}</strong>
              <a class="phone" :href="`tel:${order.customer_phone}`"><i class="fa-solid fa-phone" aria-hidden="true"></i> {{ order.customer_phone }}</a>
            </td>
            <td><span class="source-pill">{{ sourceLabel(order.source) }}</span></td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>{{ money(order.total) }}</td>
            <td>
              <span v-if="order.notified_at" class="badge badge-ok">Yuborilgan</span>
              <span v-else class="badge badge-warn">Telegramga yuborilmagan</span>
            </td>
            <td>
              <select
                class="status-select"
                :value="order.status"
                :disabled="busyId === order.id"
                @change="changeStatus(order, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </td>
            <td><button class="icon-btn" @click="openDetail(order)"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Batafsil</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Mobil: kartalar -->
    <section v-if="orders.length" class="order-cards mobile-only">
      <article v-for="order in orders" :key="order.id" class="o-card">
        <div class="o-card-head">
          <strong>#{{ order.id }} · {{ order.customer_name }}</strong>
          <span class="source-pill">{{ sourceLabel(order.source) }}</span>
        </div>
        <a class="phone" :href="`tel:${order.customer_phone}`"><i class="fa-solid fa-phone" aria-hidden="true"></i> {{ order.customer_phone }}</a>
        <div class="o-card-meta">
          <span>{{ formatDate(order.created_at) }}</span>
          <strong>{{ money(order.total) }}</strong>
        </div>
        <span v-if="order.notified_at" class="badge badge-ok">Yuborilgan</span>
        <span v-else class="badge badge-warn">Telegramga yuborilmagan</span>
        <div class="o-card-actions">
          <select
            class="status-select"
            :value="order.status"
            :disabled="busyId === order.id"
            @change="changeStatus(order, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <button class="secondary-button" @click="openDetail(order)"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Batafsil</button>
        </div>
      </article>
    </section>

    <div v-if="hasMore" class="more-row">
      <button class="secondary-button" :disabled="loadingMore" @click="loadMore">
        <i class="fa-solid" :class="loadingMore ? 'fa-spinner fa-spin' : 'fa-chevron-down'" aria-hidden="true"></i>
        {{ loadingMore ? 'Yuklanmoqda…' : 'Ko‘proq' }}
      </button>
    </div>

    <!-- Tafsilot paneli -->
    <div v-if="detail" class="detail-overlay" @click.self="closeDetail" @keydown.esc="closeDetail">
      <aside class="detail-panel" role="dialog" aria-modal="true" :aria-label="`Buyurtma #${detail.id}`">
        <header class="detail-head">
          <div>
            <span class="eyebrow">Buyurtma #{{ detail.id }}</span>
            <h2>{{ detail.customer_name }}</h2>
          </div>
          <button type="button" class="icon-btn only-icon" title="Yopish" aria-label="Yopish" @click="closeDetail"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </header>

        <p v-if="detailLoading" class="empty">Yuklanmoqda…</p>

        <dl class="detail-meta">
          <div><dt>Telefon</dt><dd><a class="phone" :href="`tel:${detail.customer_phone}`">{{ detail.customer_phone }}</a></dd></div>
          <div><dt>Manba</dt><dd>{{ sourceLabel(detail.source) }}</dd></div>
          <div><dt>Sana</dt><dd>{{ formatDate(detail.created_at) }}</dd></div>
          <div><dt>Holat</dt><dd>{{ statusLabel(detail.status) }}</dd></div>
          <div>
            <dt>Bildirishnoma</dt>
            <dd>{{ detail.notified_at ? formatDate(detail.notified_at) : 'Telegramga yuborilmagan' }}</dd>
          </div>
          <div v-if="detail.comment"><dt>Izoh</dt><dd>{{ detail.comment }}</dd></div>
        </dl>

        <table class="items-table">
          <thead><tr><th>Mahsulot</th><th>Miqdor</th><th>Narx</th><th>Jami</th></tr></thead>
          <tbody>
            <tr v-for="(item, i) in detail.items" :key="i">
              <td>{{ item.product_name }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ money(item.unit_price) }}</td>
              <td>{{ money(item.line_total) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="3">Jami</td><td><strong>{{ money(detail.total) }}</strong></td></tr>
          </tfoot>
        </table>

        <label class="detail-status">Holatni o‘zgartirish
          <select
            :value="detail.status"
            :disabled="busyId === detail.id"
            @change="changeStatus(detail, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
.filters label { display: grid; gap: 6px; font-weight: 700; font-size: .85rem; }
.empty { color: var(--muted); text-align: center; padding: 24px; }

.phone { display: block; color: var(--accent-dark); font-weight: 700; }
.source-pill { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: #ece5d8; color: var(--accent-dark); font-size: .75rem; font-weight: 800; }
.status-select { padding: 8px 10px; border-radius: 10px; }

.badge { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: .72rem; font-weight: 800; }
.badge-ok { background: #e8f3ed; color: var(--success); }
.badge-warn { background: #f6ecd7; color: #8a6a1f; }

.link-button { background: none; border: 0; padding: 0; color: var(--accent-dark); font-weight: 700; text-decoration: underline; cursor: pointer; }

.more-row { display: flex; justify-content: center; margin-top: 20px; }

/* Mobil kartalar */
/* .mobile-only yashirinligi `.order-cards { display: grid }` bilan bekor bo‘lmasligi uchun
   grid faqat mobil media-query’da beriladi. */
.mobile-only { display: none; }
.order-cards { gap: 14px; }
.o-card { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 16px; display: grid; gap: 8px; }
.o-card-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.o-card-meta { display: flex; justify-content: space-between; align-items: center; color: var(--muted); }
.o-card-actions { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }

/* Tafsilot paneli */
.detail-overlay { position: fixed; inset: 0; background: rgb(24 22 18 / 45%); display: flex; justify-content: flex-end; z-index: 50; }
.detail-panel { width: min(460px, 100%); height: 100%; overflow-y: auto; background: var(--bg); padding: 24px; }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.detail-head h2 { margin: 4px 0 0; }
.detail-meta { display: grid; gap: 10px; margin-bottom: 22px; }
.detail-meta div { display: grid; grid-template-columns: 120px 1fr; gap: 12px; }
.detail-meta dt { color: var(--muted); }
.detail-meta dd { margin: 0; font-weight: 600; }
.items-table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.items-table th, .items-table td { padding: 11px 12px; text-align: left; border-bottom: 1px solid var(--line); font-size: .9rem; }
.items-table th { color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
.items-table tfoot td { border-bottom: 0; }
.detail-status { display: grid; gap: 8px; margin-top: 22px; font-weight: 700; }

@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
  .detail-panel { width: 100%; }
}
</style>
