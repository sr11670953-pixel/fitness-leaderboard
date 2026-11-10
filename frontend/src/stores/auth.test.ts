import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
vi.mock('@/api/client', () => ({ api: { post: vi.fn(), get: vi.fn() }, refreshAccessToken: vi.fn(), parseApiError: () => ({ message: 'Error', fieldErrors: {} }) }))
import { api, refreshAccessToken } from '@/api/client'
import { useAuthStore } from './auth'
const user = { id: 'u1', role: 'user' as const }
beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })
describe('auth', () => {
  it('login guarda token solo en memoria', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user, accessToken: 'secret' } })
    const auth = useAuthStore()
    expect(await auth.login({ email: 'a@b.com', password: '123' })).toBe(true)
    expect(auth.accessToken).toBe('secret')
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
  it('logout limpia sesión incluso con error de red', async () => {
    const auth = useAuthStore(); auth.user = user; auth.accessToken = 'secret'
    vi.mocked(api.post).mockRejectedValueOnce(new Error('offline'))
    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)
  })
  it('refresh restaura sesión y consulta me', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValueOnce('renewed')
    vi.mocked(api.get).mockResolvedValueOnce({ data: { user } })
    const auth = useAuthStore(); await auth.restoreSession()
    expect(auth.accessToken).toBe('renewed'); expect(auth.user?.id).toBe('u1')
  })
  it('refresh fallido termina sin bucles', async () => {
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(new Error('401'))
    const auth = useAuthStore(); await auth.restoreSession(); await auth.restoreSession()
    expect(auth.isAuthenticated).toBe(false)
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
  })
})
