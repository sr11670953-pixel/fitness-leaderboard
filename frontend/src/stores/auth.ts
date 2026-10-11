import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, parseApiError, refreshAccessToken } from '@/api/client'
import { useActivitiesStore } from '@/stores/activities'
import type {
  FieldErrors,
  LoginInput,
  LoginResponse,
  MeResponse,
  RegisterInput,
  User,
} from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  // El accessToken vive SOLO en memoria: nunca en localStorage ni sessionStorage.
  const accessToken = ref<string | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const fieldErrors = ref<FieldErrors>({})
  const initialized = ref(false)

  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null)

  let restorePromise: Promise<void> | null = null

  function setAccessToken(token: string | null): void {
    accessToken.value = token
  }

  function clearError(): void {
    error.value = null
    fieldErrors.value = {}
  }

  function clearSession(): void {
    user.value = null
    accessToken.value = null
    useActivitiesStore().reset()
  }

  async function register(input: RegisterInput): Promise<boolean> {
    loading.value = true
    clearError()
    try {
      await api.post<User>('/auth/register', input)
      return true
    } catch (e) {
      const parsed = parseApiError(e)
      error.value = parsed.message
      fieldErrors.value = parsed.fieldErrors
      return false
    } finally {
      loading.value = false
    }
  }

  async function login(input: LoginInput): Promise<boolean> {
    loading.value = true
    clearError()
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', input)
      user.value = data.user
      accessToken.value = data.accessToken
      return true
    } catch (e) {
      const parsed = parseApiError(e)
      error.value = parsed.message
      fieldErrors.value = parsed.fieldErrors
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await api.post('/auth/logout')
    } catch {
      // Aunque el servidor falle, cerramos la sesión localmente.
    } finally {
      clearSession()
      loading.value = false
    }
  }

  /**
   * Al recargar la página el accessToken (solo en memoria) se pierde.
   * Si todavía existe la cookie del refresh token, recuperamos la sesión.
   */
  function restoreSession(): Promise<void> {
    if (initialized.value) return Promise.resolve()

    restorePromise ??= (async () => {
      try {
        accessToken.value = await refreshAccessToken()
        const { data } = await api.get<MeResponse>('/auth/me')
        user.value = data.user
      } catch {
        clearSession()
      } finally {
        initialized.value = true
        restorePromise = null
      }
    })()

    return restorePromise
  }

  return {
    user,
    accessToken,
    loading,
    error,
    fieldErrors,
    initialized,
    isAuthenticated,
    setAccessToken,
    clearError,
    clearSession,
    register,
    login,
    logout,
    restoreSession,
  }
})
