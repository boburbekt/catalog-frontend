/**
 * Admin autentifikatsiyasi — barcha admin sahifalari va layout uchun yagona manba.
 *
 * Token cookie'da (`useAdminToken`). Kirish/chiqish shu yerdan boshqariladi.
 * 401 kelganda `signOut()` chaqiriladi — layout tokenni kuzatib, login formasiga qaytadi
 * (har sahifada login/logout mantig‘i takrorlanmaydi).
 */
export const useAdminAuth = () => {
  const token = useAdminToken()

  const isAuthed = computed(() => !!token.value)

  const signIn = (value: string): boolean => {
    const trimmed = value.trim()
    if (!trimmed) return false
    token.value = trimmed
    return true
  }

  const signOut = () => {
    token.value = null
  }

  return { token, isAuthed, signIn, signOut }
}
