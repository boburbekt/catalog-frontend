/**
 * Admin tokeni cookie'si.
 *
 * `useCookie` har chaqiruvda yangi ref yaratadi va ular o‘zaro sinxronlanmaydi — sahifada tokenni
 * o‘zgartirsak, boshqa joydagi nusxa eskisini ko‘rib qolardi. Shuning uchun ref nuxtApp'da
 * bir marta yaratilib, keyingi chaqiruvlarga o‘sha qaytariladi.
 */
export const useAdminToken = () => {
  const nuxtApp = useNuxtApp() as { _adminToken?: Ref<string | null> }
  nuxtApp._adminToken ||= useCookie<string | null>('admin_token', {
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 30
  })
  return nuxtApp._adminToken
}

/**
 * Public API — katalog, mahsulot va buyurtma sahifalari uchun.
 * X-Admin-Token HECH QACHON yuborilmaydi, hatto brauzerda admin cookie mavjud bo‘lsa ham.
 */
export const usePublicApi = () => {
  const config = useRuntimeConfig()
  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: { Accept: 'application/json' }
  })
}

/**
 * Admin API — faqat `/admin/**` endpointlari uchun.
 * Har so‘rovga cookie'dagi admin token X-Admin-Token sifatida qo‘shiladi.
 */
export const useAdminApi = () => {
  const config = useRuntimeConfig()
  const adminToken = useAdminToken()

  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: { Accept: 'application/json' },
    onRequest({ options }) {
      if (!adminToken.value) return
      const headers = new Headers(options.headers as HeadersInit)
      headers.set('X-Admin-Token', adminToken.value)
      options.headers = headers
    }
  })
}
