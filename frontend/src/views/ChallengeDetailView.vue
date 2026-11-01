<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import ChallengeStatusChip from '@/components/ChallengeStatusChip.vue'
import { useChallengesStore } from '@/stores/challenges'
import { describeChallenge } from '@/utils/challenges'

const props = defineProps<{ id: string }>()

const store = useChallengesStore()
const { loading, error, loaded, joiningId, joinError } = storeToRefs(store)

const challenge = computed(() => store.find(props.id))
const summary = computed(() => (challenge.value ? describeChallenge(challenge.value) : null))
const joined = computed(() => store.isJoined(props.id))

const showLoading = computed(() => loading.value || (!loaded.value && error.value === null))
const notFound = computed(
  () => loaded.value && !loading.value && error.value === null && challenge.value === undefined,
)

const joinLabel = computed(() => {
  if (joiningId.value === props.id) return 'Uniéndome…'
  if (joined.value) return 'Ya participas'
  if (summary.value?.status === 'finished') return 'Reto terminado'
  return 'Unirme al reto'
})

onMounted(() => {
  if (!loaded.value) void store.load()
})
</script>

<template>
  <div class="page">
    <p class="back">
      <RouterLink :to="{ name: 'challenges' }">Volver a los retos</RouterLink>
    </p>

    <p v-if="error" class="alert alert--error" role="alert">
      {{ error }}
      <button class="btn btn--ghost retry" type="button" @click="store.load()">Reintentar</button>
    </p>

    <p v-if="showLoading" class="empty" role="status">
      <span class="spinner" aria-hidden="true"></span> Cargando reto…
    </p>

    <p v-else-if="notFound" class="empty">
      No encontramos este reto. Puede que ya no exista; revisa la lista de retos.
    </p>

    <section v-else-if="challenge && summary" class="panel" aria-labelledby="challenge-title">
      <div class="head">
        <h1 id="challenge-title">{{ challenge.name }}</h1>
        <ChallengeStatusChip :status="summary.status" :label="summary.statusLabel" />
      </div>

      <dl class="facts">
        <div class="facts__row">
          <dt>Fechas</dt>
          <dd>{{ summary.range }}</dd>
        </div>
        <div class="facts__row">
          <dt>Estado</dt>
          <dd>{{ summary.hint }}</dd>
        </div>
        <div class="facts__row">
          <dt>Tu participación</dt>
          <dd>{{ joined ? 'Estás inscrito en este reto.' : 'Todavía no te has unido.' }}</dd>
        </div>
      </dl>

      <p v-if="joinError" class="alert alert--error" role="alert">{{ joinError }}</p>

      <button
        class="btn"
        type="button"
        :disabled="joined || summary.status === 'finished' || joiningId !== null"
        @click="store.join(props.id)"
      >
        {{ joinLabel }}
      </button>

      <p class="alert note" role="note">
        Estos son datos de ejemplo. La inscripción real se conectará cuando el backend exponga la ruta.
      </p>
    </section>
  </div>
</template>

<style scoped>
.back { margin-bottom: 1.25rem; }
.retry { margin-left: 0.75rem; min-height: 2.25rem; }
.head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1rem; margin-bottom: 1.25rem; }
.facts { margin: 0 0 1.5rem; border: 1px solid var(--line); }
.facts__row {
  display: grid;
  grid-template-columns: minmax(8rem, 12rem) 1fr;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--line);
}
.facts__row:last-child { border-bottom: 0; }
.facts dt { color: var(--muted); }
.facts dd { margin: 0; }
.note { margin: 1.25rem 0 0; }
</style>
