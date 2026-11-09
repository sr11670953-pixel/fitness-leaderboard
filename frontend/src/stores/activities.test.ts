import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
vi.mock('@/api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() }, parseApiError: () => ({ message: 'Error', fieldErrors: {} }) }))
import { api } from '@/api/client'
import { useActivitiesStore } from './activities'
const activity = { id: 'a1', userId: 'u1', activityTypeId: 1, activityTypeName: 'Correr', durationMinutes: 20, distanceKm: 2, performedAt: '2026-11-01T12:00:00Z', createdAt: '2026-11-01T12:00:00Z', points: 0 }
beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks(); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())
describe('activities', () => {
  it('consulta actividades y total', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ ...activity, points: 50 }] })
    const store = useActivitiesStore(); await store.fetchActivities()
    expect(store.items).toHaveLength(1); expect(store.totalPoints).toBe(50)
  })
  it('tras crear refresca y consulta puntos pendientes', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: activity })
    vi.mocked(api.get).mockResolvedValueOnce({ data: [activity] }).mockResolvedValueOnce({ data: [{ ...activity, points: 60 }] })
    const store = useActivitiesStore()
    expect(await store.createActivity({ activityTypeId: 1, durationMinutes: 20, distanceKm: 2, performedAt: activity.performedAt })).toBe(true)
    expect(store.pendingIds).toContain('a1')
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.totalPoints).toBe(60); expect(store.pendingIds).toHaveLength(0)
    store.reset()
  })
})
