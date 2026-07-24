/**
 * Admin tokeni cookie'si.
 *
 * `useCookie` har chaqiruvda yangi ref yaratadi va ular o‘zaro sinxronlanmaydi — sahifada tokenni
 * o‘zgartirsak, `useApi` ichidagi nusxa eskisini ko‘rib qolardi. Shuning uchun ref nuxtApp'da
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

export const useApi = () => {
  const config = useRuntimeConfig()
  const adminToken = useAdminToken()

  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: { Accept: 'application/json' },
    onRequest({ options }) {
      // Admin so‘rovlarida tenant shu token orqali aniqlanadi; public sahifalarda cookie bo‘sh bo‘ladi.
      if (!adminToken.value) return
      const headers = new Headers(options.headers as HeadersInit)
      headers.set('X-Admin-Token', adminToken.value)
      options.headers = headers
    }
  })
}
