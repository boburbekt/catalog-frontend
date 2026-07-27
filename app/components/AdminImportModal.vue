<script setup lang="ts">
import type { ImportResult } from '~/types/api'

/**
 * Excel (.xlsx) orqali mahsulot importi modali.
 *
 * Ikki qadam: (1) shablon yuklab olish + fayl tanlash/tashlash, (2) natija ekrani.
 * O‘z api chaqiruvlari va holatini boshqaradi; muvaffaqiyatli importda `imported`
 * emit qiladi (ota sahifa ro‘yxatni yangilaydi), yopilganda `close`.
 */
const emit = defineEmits<{ close: [], imported: [] }>()

const api = useAdminApi()

const MAX_MB = 5

const selectedFile = ref<File | null>(null)
const dragging = ref(false)
const uploading = ref(false)
const downloadingTemplate = ref(false)
const errorMessage = ref('')
const result = ref<ImportResult | null>(null)

const isXlsx = (file: File) => file.name.toLowerCase().endsWith('.xlsx')

// Fayl tanlash (input yoki drag-drop) — yagona tekshiruv (client tomon .xlsx + hajm).
const handleFile = (file: File | undefined | null) => {
  if (!file) return
  if (!isXlsx(file)) {
    errorMessage.value = 'Faqat .xlsx (Excel) fayl qabul qilinadi.'
    return
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    errorMessage.value = `Fayl hajmi ${MAX_MB} MB dan oshmasligi kerak.`
    return
  }
  errorMessage.value = ''
  selectedFile.value = file
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  handleFile(input.files?.[0])
  input.value = '' // bir xil faylni qayta tanlash mumkin bo‘lsin
}

const onDrop = (event: DragEvent) => {
  dragging.value = false
  handleFile(event.dataTransfer?.files?.[0])
}

const downloadTemplate = async () => {
  downloadingTemplate.value = true
  errorMessage.value = ''
  try {
    const blob = await api<Blob>('/admin/products/import/template', { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mahsulotlar-shablon.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    errorMessage.value = adminErrorMessage(e, 'Shablonni yuklab bo‘lmadi.')
  } finally {
    downloadingTemplate.value = false
  }
}

const startImport = async () => {
  if (!selectedFile.value || uploading.value) return
  uploading.value = true
  errorMessage.value = ''
  try {
    const body = new FormData()
    body.append('file', selectedFile.value)
    result.value = await api<ImportResult>('/admin/products/import', { method: 'POST', body })
    emit('imported')
  } catch (e: any) {
    // 413 (hajm) va 422 (format / qator limiti) backend detail matnini beradi.
    errorMessage.value = adminErrorMessage(e, 'Faylni import qilib bo‘lmadi.')
  } finally {
    uploading.value = false
  }
}

// Natija ekranidan yana bir fayl yuklashga qaytish.
const importAnother = () => {
  result.value = null
  selectedFile.value = null
  errorMessage.value = ''
}

const successLabel = computed(() => {
  const n = result.value?.created ?? 0
  return `${n} ta mahsulot qo‘shildi`
})
</script>

<template>
  <div class="import-overlay" @click.self="emit('close')">
    <div class="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <header class="import-head">
        <strong id="import-title"><i class="fa-solid fa-file-excel" aria-hidden="true"></i> Excel orqali import</strong>
        <button type="button" class="icon-btn only-icon" title="Yopish" aria-label="Yopish" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </header>

      <!-- 1-qadam: shablon + fayl tanlash -->
      <div v-if="!result" class="import-body">
        <ol class="steps">
          <li>Shablonni yuklab oling.</li>
          <li>Mahsulotlaringizni kiriting (namuna qatorlarni o‘chiring).</li>
          <li>To‘ldirilgan faylni shu yerga tashlang.</li>
        </ol>

        <button
          type="button"
          class="secondary-button"
          :disabled="downloadingTemplate"
          @click="downloadTemplate"
        ><i class="fa-solid" :class="downloadingTemplate ? 'fa-spinner fa-spin' : 'fa-download'" aria-hidden="true"></i> {{ downloadingTemplate ? 'Yuklanmoqda…' : 'Shablonni yuklab olish' }}</button>

        <div
          class="drop-zone"
          :class="{ dragging }"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <p v-if="selectedFile" class="chosen-file">
            <strong>{{ selectedFile.name }}</strong>
            <button type="button" class="link-button" @click="selectedFile = null">Bekor qilish</button>
          </p>
          <p v-else class="drop-hint"><i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> Faylni shu yerga tashlang yoki tanlang</p>

          <label class="upload-btn">
            <input class="sr-file" type="file" accept=".xlsx" @change="onFileChange">
            <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
            <span>{{ selectedFile ? 'Boshqa fayl' : 'Fayl tanlash' }}</span>
          </label>
          <small class="field-hint">Faqat .xlsx · maksimal {{ MAX_MB }} MB</small>
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <div class="import-actions">
          <button
            type="button"
            class="primary-button"
            :disabled="!selectedFile || uploading"
            @click="startImport"
          ><i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-file-import'" aria-hidden="true"></i> {{ uploading ? 'Import qilinmoqda…' : 'Import qilish' }}</button>
          <button type="button" class="secondary-button" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true"></i> Bekor qilish</button>
        </div>
      </div>

      <!-- 2-qadam: natija -->
      <div v-else class="import-body">
        <div class="result-summary">
          <span class="result-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
          <strong>{{ successLabel }}</strong>
        </div>

        <div v-if="result.errors.length" class="result-errors">
          <p class="result-errors-title">{{ result.skipped }} ta qator o‘tkazib yuborildi:</p>
          <ul>
            <li v-for="err in result.errors" :key="err.row">{{ err.message }}</li>
          </ul>
          <p class="field-hint">
            Xato qatorlarni Excel’da tuzatib, faqat o‘shalarni qayta yuklashingiz mumkin.
          </p>
        </div>

        <p class="image-note">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          Excel’dan rasm yuklanmaydi. Rasmsiz mahsulotlar ro‘yxatda belgilanadi —
          har biriga rasm qo‘shib chiqing.
        </p>

        <div class="import-actions">
          <button type="button" class="primary-button" @click="emit('close')"><i class="fa-solid fa-check" aria-hidden="true"></i> Yopish</button>
          <button type="button" class="secondary-button" @click="importAnother"><i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i> Yana fayl yuklash</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: flex-start; justify-content: center;
  background: rgb(20 14 8 / 45%); padding: 24px 16px; overflow-y: auto;
}
.import-modal {
  width: min(560px, 100%); background: var(--bg);
  border: 1px solid var(--line); border-radius: 18px; padding: 22px;
  margin: auto; box-shadow: 0 20px 60px rgb(20 14 8 / 25%);
}
.import-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.import-head strong { font-size: 1.15rem; }
.import-body { display: grid; gap: 16px; }

.steps { margin: 0; padding-left: 20px; display: grid; gap: 4px; color: var(--muted); font-weight: 600; }

.drop-zone {
  display: grid; gap: 10px; justify-items: center; text-align: center;
  border: 2px dashed var(--line); border-radius: 16px; padding: 22px; background: var(--surface);
  transition: border-color .15s ease, background .15s ease;
}
.drop-zone.dragging { border-color: var(--accent); background: #f6efe4; }
.drop-hint { margin: 0; color: var(--muted); font-weight: 600; }
.chosen-file { margin: 0; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }

.upload-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 999px; padding: 11px 20px; font-weight: 750; border: 1px solid var(--line);
  background: var(--bg); cursor: pointer; min-height: 44px;
}
.upload-btn:hover { border-color: var(--accent); }
.upload-btn:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgb(150 109 63 / 15%); }
.sr-file { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }

.field-hint { color: var(--muted); font-weight: 600; }
.link-button {
  background: none; border: 0; padding: 0; color: var(--accent-dark);
  font-weight: 700; text-decoration: underline; cursor: pointer;
}

.result-summary {
  display: flex; align-items: center; gap: 12px;
  background: #e8f3ed; border-radius: 14px; padding: 18px;
}
.result-summary strong { font-size: 1.25rem; }
.result-check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 999px; background: var(--success); color: #fff;
  font-weight: 900; flex: none;
}
.result-errors {
  border: 1px solid var(--line); border-radius: 14px; padding: 14px; background: var(--surface);
}
.result-errors-title { margin: 0 0 8px; font-weight: 800; }
.result-errors ul { margin: 0 0 8px; padding-left: 20px; display: grid; gap: 4px; }
.result-errors li { color: #a32323; font-weight: 600; }

.image-note {
  margin: 0; background: #fbf3e2; border: 1px solid #e7d6ad; border-radius: 14px;
  padding: 14px; font-weight: 600; color: #6b531f;
}

.import-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.import-actions .primary-button, .import-actions .secondary-button { min-height: 44px; }

@media (max-width: 640px) {
  .import-actions .primary-button, .import-actions .secondary-button { flex: 1; }
}
</style>
