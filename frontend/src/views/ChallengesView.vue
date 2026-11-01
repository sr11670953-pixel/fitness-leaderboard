<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import ChallengeStatusChip from '@/components/ChallengeStatusChip.vue'
import { useChallengesStore } from '@/stores/challenges'
import { describeChallenge, statusOrder } from '@/utils/challenges'

const store = useChallengesStore()
const { items, loading, error, loaded, joiningId, joinError } = storeToRefs(store)

const rows = computed(() => {
  const now = Date.now()
  return items.value
    .map((challenge) => ({ ...challenge, ...describeChallenge(challenge, now) }))
    .sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        Date.parse(a.startsAt) - Date.parse(b.startsAt),
    )
})

const showLoading = computed(() => loading.value || (!loaded.value && error.value === null))
const showEmpty = computed(
  () => loaded.value && !loading.value && error.value === null && rows.value.length === 0,
)

function joinLabel(id: string, status: string): string {
  if (joiningId.value === id) return 'Uniéndome…'
  if (store.isJoined(id)) return 'Ya participas'
  if (status === 'finished') return 'Terminado'
  return 'Unirme'
}

onMounted(() => {
  void store.load()
})
</script>

<template>
  <div class="page">
    <div class="page__head">
      <div>
        <h1>Retos</h1>
        <p class="page__lede">Competencias con fecha de inicio y de cierre.</p>
      </div>
      <button class="btn btn--ghost" type="button" :disabled="loading" @click="store.load()">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </div>

    <p class="alert" role="note">
      Estos son datos de ejemplo. Los retos reales se conectarán cuando el backend exponga la ruta.
    </p>

    <p v-if="error" class="alert alert--error" role="alert">
      {{ error }}
      <button class="btn btn--ghost retry" type="button" @click="store.load()">Reintentar</button>
    </p>

    <p v-if="joinError" class="alert alert--error" role="alert">{{ joinError }}</p>

    <p v-if="showLoading" class="empty" role="status">
      <span class="spinner" aria-hidden="true"></span> Cargando retos…
    </p>

    <p v-else-if="showEmpty" class="empty">
      Todavía no hay retos. Cuando se publique el primero aparecerá aquí.
    </p>

    <ul v-else-if="rows.length > 0" class="challenges">
      <li v-for="row in rows" :key="row.id" class="challenge" :class="`challenge--${row.status}`">
        <div class="challenge__main">
          <h2>
            <RouterLink class="challenge__link" :to="{ name: 'challenge-detail', params: { id: row.id } }">
              {{ row.name }}
            </RouterLink>
          </h2>
          <p class="challenge__range">{{ row.range }}</p>
        </div>
        <div class="challenge__side">
          <ChallengeStatusChip :status="row.status" :label="row.statusLabel" />
          <p class="challenge__hint">{{ row.hint }}</p>
        </div>
        <button
          class="btn"
          :class="{ 'btn--ghost': store.isJoined(row.id) }"
          type="button"
          :disabled="store.isJoined(row.id) || row.status === 'finished' || joiningId !== null"
          :aria-label="`${joinLabel(row.id, row.status)}: ${row.name}`"
          @click="store.join(row.id)"
        >
          {{ joinLabel(row.id, row.status) }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.retry { margin-left: 0.75rem; min-height: 2.25rem; }
.challenges { margin: 0; padding: 0; list-style: none; background: var(--surface); border: 1px solid var(--line); }
.challenge {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.5rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
  border-left: 6px solid var(--line);
}
.challenge:last-child { border-bottom: 0; }
.challenge--active { border-left-color: var(--ink); }
.challenge--finished { color: var(--muted); }

.challenge__main { flex: 1 1 14rem; }
.challenge__main h2 { font-size: 1.4rem; }
.challenge__link { color: inherit; text-decoration: none; }
.challenge__link:hover { text-decoration: underline; }
.challenge__range { color: var(--muted); }
.challenge__side { text-align: right; }
.challenge__hint { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.95rem; }
</style>
