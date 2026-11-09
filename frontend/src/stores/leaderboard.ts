import { computed, ref } from 'vue'
import { api, parseApiError } from '@/api/client'
import { defineStore } from 'pinia'
import {
  createLeaderboardSimulator,
  createLeaderboardSocket,
  type LeaderboardSource,
} from '@/api/leaderboardSocket'
import type { ConnectionState, LeaderboardEntry } from '@/types'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const entries = ref<LeaderboardEntry[]>([])
  const connection = ref<ConnectionState>('idle')
  const error = ref<string | null>(null)
  // true mientras se muestran datos falsos del simulador.
  const isSimulated = ref(false)
  // true cuando ya llegó al menos un mensaje real del backend.
  const hasLiveData = ref(false)

  const isLoading = computed(() => connection.value === 'connecting' && entries.value.length === 0)
  const isEmpty = computed(
    () => hasLiveData.value && connection.value === 'open' && entries.value.length === 0,
  )

  let socket: LeaderboardSource | null = null
  let simulator: LeaderboardSource | null = null

  function stopSimulator(): void {
    simulator?.stop()
    simulator = null
  }

  function startSimulator(): void {
    if (simulator !== null) return
    isSimulated.value = true
    simulator = createLeaderboardSimulator({
      onEntries: (list) => {
        entries.value = list
      },
    })
    simulator.start()
  }

  async function loadInitial(): Promise<void> {
    try {
      const { data } = await api.get<{ entries: LeaderboardEntry[] } | LeaderboardEntry[]>('/leaderboard')
      entries.value = (Array.isArray(data) ? data : data.entries).sort((a, b) => a.position - b.position)
      hasLiveData.value = true
    } catch (e) { error.value = parseApiError(e).message }
  }

  function start(): void {
    if (socket !== null || simulator !== null) return
    if (import.meta.env.VITE_USE_MOCK_LEADERBOARD !== 'false') {
      entries.value = []
      connection.value = 'open'
      startSimulator()
      return
    }
    entries.value = []
    error.value = null
    isSimulated.value = false
    hasLiveData.value = false

    socket = createLeaderboardSocket({
      onStatus: (state) => {
        connection.value = state
        if (state === 'open') error.value = null
      },
      onEntries: (list) => {
        stopSimulator()
        isSimulated.value = false
        hasLiveData.value = true
        error.value = null
        entries.value = list
      },
      onDrop: () => {
        if (hasLiveData.value) {
          error.value =
            'Se perdió la conexión. Mostrando el último ranking recibido mientras se reconecta.'
        } else {
          error.value =
            'No se pudo conectar con el ranking en vivo. Se intentará de nuevo automáticamente.'
          // En modo real no se sustituyen datos por simulaciones.
        }
      },
    })
    socket.start()
    void loadInitial()
  }

  function stop(): void {
    socket?.stop()
    socket = null
    stopSimulator()
    isSimulated.value = false
    connection.value = 'idle'
  }

  /** Corta lo que haya y vuelve a conectar desde cero. */
  function retry(): void {
    stop()
    start()
  }

  return {
    entries,
    connection,
    error,
    isSimulated,
    hasLiveData,
    isLoading,
    isEmpty,
    start,
    stop,
    retry,
    loadInitial,
  }
})
