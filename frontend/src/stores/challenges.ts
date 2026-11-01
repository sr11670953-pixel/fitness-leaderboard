import { ref } from 'vue'
import { defineStore } from 'pinia'
import { parseApiError } from '@/api/client'
import { buildMockChallenges } from '@/data/mockChallenges'
import { statusOf } from '@/utils/challenges'
import type { Challenge } from '@/types'

const MOCK_DELAY_MS = 500

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const useChallengesStore = defineStore('challenges', () => {
  const items = ref<Challenge[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Distingue "todavía no cargué" de "cargué y no hay retos".
  const loaded = ref(false)

  // Retos a los que el usuario se unió (por ahora solo en memoria, con datos falsos).
  const joinedIds = ref<string[]>([])
  const joiningId = ref<string | null>(null)
  const joinError = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // Cuando el backend tenga la ruta, reemplazar este bloque por:
      // const { data } = await api.get<Challenge[]>('/challenges')
      // items.value = data
      await wait(MOCK_DELAY_MS)
      items.value = buildMockChallenges()
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
      await wait(MOCK_DELAY_MS)
      if (!joinedIds.value.includes(id)) joinedIds.value = [...joinedIds.value, id]
      return true
    } catch (e) {
      joinError.value = parseApiError(e).message
      return false
    } finally {
      joiningId.value = null
    }
  }

  function reset(): void {
    items.value = []
    error.value = null
    loaded.value = false
    loading.value = false
    joinedIds.value = []
    joiningId.value = null
    joinError.value = null
  }

  return { items, loading, error, loaded, joinedIds, joiningId, joinError, load, find, isJoined, join, reset }
})
