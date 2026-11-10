import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, parseApiError } from '@/api/client'
import type { Activity, ActivityType, FieldErrors, NewActivityInput } from '@/types'

function byMostRecent(a: Activity, b: Activity): number {
  return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
}

export const useActivitiesStore = defineStore('activities', () => {
  // Estado normalizado: un diccionario por id + una lista ordenada de ids.
  const byId = ref<Record<string, Activity>>({})
  const ids = ref<string[]>([])
  const types = ref<ActivityType[]>([])

  const loading = ref(false)
  const saving = ref(false)
  const deletingId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const fieldErrors = ref<FieldErrors>({})
  const pendingIds = ref<string[]>([])
  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let pollGeneration = 0

  const items = computed<Activity[]>(() =>
    ids.value
      .map((id) => byId.value[id])
      .filter((activity): activity is Activity => activity !== undefined),
  )
  const totalPoints = computed(() => items.value.reduce((sum, a) => sum + a.points, 0))
  const totalMinutes = computed(() => items.value.reduce((sum, a) => sum + a.durationMinutes, 0))

  function setAll(list: Activity[]): void {
    const sorted = [...list].sort(byMostRecent)
    byId.value = Object.fromEntries(sorted.map((a) => [a.id, a]))
    ids.value = sorted.map((a) => a.id)
  }

  function upsert(activity: Activity): void {
    byId.value = { ...byId.value, [activity.id]: activity }
    if (!ids.value.includes(activity.id)) {
      ids.value = [...ids.value, activity.id]
    }
    ids.value = [...ids.value].sort((a, b) => {
      const first = byId.value[a]
      const second = byId.value[b]
      return first && second ? byMostRecent(first, second) : 0
    })
  }

  function remove(id: string): void {
    const { [id]: _removed, ...rest } = byId.value
    byId.value = rest
    ids.value = ids.value.filter((currentId) => currentId !== id)
  }

  function clearError(): void {
    error.value = null
    fieldErrors.value = {}
  }

  async function fetchTypes(): Promise<void> {
    if (types.value.length > 0) return
    try {
      const { data } = await api.get<ActivityType[]>('/activities/types')
      types.value = data
    } catch (e) {
      error.value = parseApiError(e).message
    }
  }

  async function fetchActivities(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<Activity[]>('/activities')
      setAll(data)
    } catch (e) {
      error.value = parseApiError(e).message
    } finally {
      loading.value = false
    }
  }

  async function pollPending(generation: number, attempts: number): Promise<void> {
    if (generation !== pollGeneration || pendingIds.value.length === 0 || attempts >= 5) return
    pollTimer = setTimeout(async () => {
      pollTimer = null
      if (generation !== pollGeneration) return
      await fetchActivities()
      pendingIds.value = pendingIds.value.filter((id) => byId.value[id]?.points === 0)
      if (pendingIds.value.length) void pollPending(generation, attempts + 1)
    }, 2000)
  }

  async function createActivity(input: NewActivityInput): Promise<boolean> {
    saving.value = true
    clearError()
    try {
      const { data } = await api.post<Activity>('/activities', input)
      upsert(data)
      if (data.points === 0 && !pendingIds.value.includes(data.id)) pendingIds.value.push(data.id)
      await fetchActivities()
      pendingIds.value = pendingIds.value.filter((id) => byId.value[id]?.points === 0)
      if (pollTimer !== null) clearTimeout(pollTimer)
      pollTimer = null
      void pollPending(++pollGeneration, 0)
      return true
    } catch (e) {
      const parsed = parseApiError(e)
      error.value = parsed.message
      fieldErrors.value = parsed.fieldErrors
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteActivity(id: string): Promise<boolean> {
    deletingId.value = id
    error.value = null
    try {
      await api.delete(`/activities/${id}`)
      remove(id)
      pendingIds.value = pendingIds.value.filter((pending) => pending !== id)
      return true
    } catch (e) {
      error.value = parseApiError(e).message
      return false
    } finally {
      deletingId.value = null
    }
  }

  function reset(): void {
    pollGeneration++
    if (pollTimer !== null) clearTimeout(pollTimer)
    pollTimer = null
    pendingIds.value = []
    byId.value = {}
    ids.value = []
    types.value = []
    loading.value = false
    saving.value = false
    deletingId.value = null
    clearError()
  }

  return {
    byId,
    ids,
    types,
    loading,
    saving,
    deletingId,
    error,
    fieldErrors,
    pendingIds,
    items,
    totalPoints,
    totalMinutes,
    fetchTypes,
    fetchActivities,
    createActivity,
    deleteActivity,
    clearError,
    reset,
  }
})
