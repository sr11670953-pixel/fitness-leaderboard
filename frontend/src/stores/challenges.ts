import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, parseApiError } from '@/api/client'
import type { LeaderboardEntry } from '@/types'
import { buildMockChallenges } from '@/data/mockChallenges'
import { statusOf } from '@/utils/challenges'
import type { Challenge } from '@/types'

const MOCK_DELAY_MS = 500
const useMock = import.meta.env.VITE_USE_MOCK_CHALLENGES !== 'false'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const useChallengesStore = defineStore('challenges', () => {
  const items = ref<Challenge[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Distingue "todavía no cargué" de "cargué y no hay retos".
  const loaded = ref(false)
  const creating = ref(false)
  const leaderboard = ref<LeaderboardEntry[]>([])
  const leaderboardLoading = ref(false)
  const leaderboardError = ref<string | null>(null)

  // Retos a los que el usuario se unió (por ahora solo en memoria, con datos falsos).
  const joinedIds = ref<string[]>([])
  const mockCreated = ref<Challenge[]>([])
  const joiningId = ref<string | null>(null)
  const joinError = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // Cuando el backend tenga la ruta, reemplazar este bloque por:
      // const { data } = await api.get<Challenge[]>('/challenges')
      // items.value = data
      if (useMock) {
        await wait(MOCK_DELAY_MS)
        items.value = [...mockCreated.value, ...buildMockChallenges()]
      } else {
        const { data } = await api.get<Challenge[]>('/challenges')
        items.value = data
      }
      loaded.value = true
    } catch (e) {
      error.value = parseApiError(e).message
    } finally {
      loading.value = false
    }
  }

  function find(id: string): Challenge | undefined {
    return items.value.find((challenge) => challenge.id === id)
  }

  function isJoined(id: string): boolean {
    return joinedIds.value.includes(id)
  }

  async function join(id: string): Promise<boolean> {
    const challenge = find(id)
    joinError.value = null
    if (!challenge) {
      joinError.value = 'No encontramos ese reto.'
      return false
    }
    if (statusOf(challenge) === 'finished') {
      joinError.value = 'Este reto ya terminó, no es posible unirse.'
      return false
    }

    joiningId.value = id
    try {
      // Cuando el backend tenga la ruta, reemplazar la espera por:
      // await api.post(`/challenges/${id}/join`)
      if (useMock) await wait(MOCK_DELAY_MS)
      else await api.post(`/challenges/${encodeURIComponent(id)}/join`)
      if (!joinedIds.value.includes(id)) joinedIds.value = [...joinedIds.value, id]
      return true
    } catch (e) {
      joinError.value = parseApiError(e).message
      return false
    } finally {
      joiningId.value = null
    }
  }

  async function create(input: Pick<Challenge, 'name' | 'startsAt' | 'endsAt'>): Promise<boolean> {
    creating.value = true
    error.value = null
    try {
      if (useMock) {
        const created = { ...input, id: `mock-${Date.now()}` }
        mockCreated.value = [created, ...mockCreated.value]
        items.value = [created, ...items.value]
      } else {
        await api.post('/challenges', input)
        await load()
      }
      loaded.value = true
      return true
    } catch (e) {
      error.value = parseApiError(e).message
      return false
    } finally { creating.value = false }
  }

  async function loadLeaderboard(id: string): Promise<void> {
    leaderboardLoading.value = true
    leaderboardError.value = null
    leaderboard.value = []
    try {
      if (useMock) {
        const { mockLeaderboard } = await import('@/data/mockLeaderboard')
        leaderboard.value = mockLeaderboard.map((row) => ({ ...row }))
      } else {
        const { data } = await api.get<{ entries: LeaderboardEntry[] } | LeaderboardEntry[]>(`/challenges/${encodeURIComponent(id)}/leaderboard`)
        leaderboard.value = Array.isArray(data) ? data : data.entries
      }
    } catch (e) { leaderboardError.value = parseApiError(e).message }
    finally { leaderboardLoading.value = false }
  }

  function reset(): void {
    items.value = []
    leaderboard.value = []
    leaderboardError.value = null
    error.value = null
    loaded.value = false
    loading.value = false
    joinedIds.value = []
    mockCreated.value = []
    joiningId.value = null
    joinError.value = null
  }

  return { items, loading, error, loaded, joinedIds, joiningId, joinError, creating, create, leaderboard, leaderboardLoading, leaderboardError, loadLeaderboard, load, find, isJoined, join, reset }
})
