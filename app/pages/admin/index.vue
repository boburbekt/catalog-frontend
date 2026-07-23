<script setup lang="ts">
interface Product {
  id: number
  name: string
  slug: string
  price: string
  availability: string
  image_url?: string | null
  category?: { name: string } | null
}

const api = useApi()
const { data: products, refresh } = await useAsyncData('admin-products', () => api<Product[]>('/admin/products'))
const showForm = ref(false)
const saving = ref(false)
const message = ref('')
const form = reactive({
  business_slug: 'demo-mebel',
  name: '',
  slug: '',
  price: 0,
  image_url: '',
  description: '',
  availability: 'in_stock'
})

watch(() => form.name, (value) => {
  form.slug = value
    .toLowerCase()
    .trim()
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
})

const saveProduct = async () => {
  saving.value = true
  message.value = ''
  try {
    await api('/admin/products', { method: 'POST', body: form })
    message.value = 'Mahsulot qo‘shildi.'
    Object.assign(form, { business_slug: 'demo-mebel', name: '', slug: '', price: 0, image_url: '', description: '', availability: 'in_stock' })
    showForm.value = false
    await refresh()
  } catch (e: any) {
    message.value = e?.data?.detail || 'Saqlashda xato.'
  } finally {
    saving.value = false
  }
}

const money = (value: string | number) => new Intl.NumberFormat('uz-UZ').format(Number(value)) + ' so‘m'
</script>

<template>
  <main class="admin-page shell">
    <header class="admin-header">
      <div>
        <span class="eyebrow">Demo boshqaruv</span>
        <h1>Mahsulotlar</h1>
        <p>MVP’da autentifikatsiya hali qo‘shilmagan.</p>
      </div>
      <div class="admin-actions">
        <NuxtLink to="/demo-mebel" class="secondary-button">Katalogni ochish</NuxtLink>
        <button class="primary-button" @click="showForm = !showForm">+ Mahsulot</button>
      </div>
    </header>

    <form v-if="showForm" class="admin-form" @submit.prevent="saveProduct">
      <label>Nomi<input v-model.trim="form.name" required></label>
      <label>Slug<input v-model.trim="form.slug" required></label>
      <label>Narxi<input v-model.number="form.price" type="number" min="1" required></label>
      <label>Rasm URL<input v-model.trim="form.image_url" type="url"></label>
      <label class="wide">Tavsif<textarea v-model.trim="form.description" rows="3"></textarea></label>
      <label>Holati<select v-model="form.availability"><option value="in_stock">Mavjud</option><option value="preorder">Buyurtma asosida</option></select></label>
      <button class="primary-button" :disabled="saving">{{ saving ? 'Saqlanmoqda…' : 'Saqlash' }}</button>
    </form>

    <p v-if="message" class="notice">{{ message }}</p>

    <section class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Holati</th></tr></thead>
        <tbody>
          <tr v-for="product in products || []" :key="product.id">
            <td><div class="table-product"><img :src="product.image_url || 'https://placehold.co/80x80?text=M'" :alt="product.name"><div><strong>{{ product.name }}</strong><small>{{ product.slug }}</small></div></div></td>
            <td>{{ product.category?.name || '—' }}</td>
            <td>{{ money(product.price) }}</td>
            <td><span class="status-pill">{{ product.availability === 'in_stock' ? 'Mavjud' : 'Buyurtma' }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>
