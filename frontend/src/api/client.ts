import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody, FieldErrors, RefreshResponse } from '@/types'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Única instancia de Axios que usa toda la app. */
export const api = axios.create({ baseURL, withCredentials: true })

/** Instancia aparte (sin interceptores) para renovar el token sin caer en un bucle. */
const refreshClient = axios.create({ baseURL, withCredentials: true })

interface AuthHandlers {
  getToken: () => string | null
  setToken: (token: string | null) => void
  onSessionExpired: () => void
}

let handlers: AuthHandlers | null = null

/** La tienda de auth se registra aquí al arrancar; así evitamos imports circulares. */
export function registerAuthHandlers(value: AuthHandlers): void {
  handlers = value
}

let refreshPromise: Promise<string> | null = null

/** Pide un accessToken nuevo. Si hay varias llamadas a la vez, comparten una sola petición. */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= refreshClient
    .post<RefreshResponse>('/auth/refresh')
    .then((response) => response.data.accessToken)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean
}

api.interceptors.request.use((config) => {
  const token = handlers?.getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
      throw error
    }

    const original: RetriableRequest = error.config
    const isAuthRoute = original.url?.startsWith('/auth/') ?? false

    if (error.response?.status !== 401 || original._retry || isAuthRoute) {
      throw error
    }

    original._retry = true

    try {
      const token = await refreshAccessToken()
      handlers?.setToken(token)
      return await api(original)
    } catch (refreshError) {
      // Si el reintento falló por otra razón distinta a la sesión, no la cerramos.
      if (isAxiosError(refreshError) && refreshError.response?.status === 401) {
        handlers?.setToken(null)
        handlers?.onSessionExpired()
      }
      throw refreshError
    }
  },
)

export interface ParsedApiError {
  message: string
  fieldErrors: FieldErrors
}

/** Convierte cualquier error de Axios en un mensaje legible y errores por campo. */
export function parseApiError(error: unknown): ParsedApiError {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return {
        message: 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo.',
        fieldErrors: {},
      }
    }
    const body = error.response.data
    if (typeof body === 'object' && body !== null && typeof body.error === 'string') {
      return { message: body.error, fieldErrors: body.details ?? {} }
    }
  }
  return { message: 'Ocurrió un error inesperado. Inténtalo de nuevo.', fieldErrors: {} }
}
