<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ActivityForm from '@/components/ActivityForm.vue'
import { useActivitiesStore } from '@/stores/activities'

const store = useActivitiesStore()
const page = ref(1)
const pageSize = 10
const pageCount = computed(() => Math.max(1, Math.ceil(store.items.length / pageSize)))
const visibleActivities = computed(() => store.items.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(() => store.items.length, () => { if (page.value > pageCount.value) page.value = pageCount.value })

const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(() => {
  void store.fetchTypes()
  void store.fetchActivities()
})

async function confirmDelete(id: string, name: string): Promise<void> {
  if (window.confirm(`¿Borrar la actividad "${name}"? Se restarán sus puntos.`)) {
    await store.deleteActivity(id)
  }
}
</script>

<template>
  <div class="page">
    <div class="page__head">
      <div>
        <h1>Mis actividades</h1>
        <p class="page__lede">Cada entrenamiento suma puntos según su duración y distancia.</p>
      </div>
      <p class="total" aria-live="polite">
        <span class="total__num">{{ store.totalPoints }}</span>
        <span class="total__label">puntos en {{ store.items.length }} actividades</span>
      </p>
    </div>

    <div class="layout">
      <ActivityForm />

      <section aria-labelledby="list-title">
        <h2 id="list-title" class="sr-only">Historial</h2>

        <p v-if="store.loading" class="empty" role="status">
          <span class="spinner" aria-hidden="true"></span> Cargando actividades…
        </p>
        <p v-else-if="store.items.length === 0 && !store.error" class="empty">
          Aún no registras actividades. Completa el formulario para sumar tus primeros puntos.
        </p>
        <p v-else-if="store.items.length === 0 && store.error" class="alert alert--error" role="alert">
          {{ store.error }}
          <button class="btn btn--ghost retry" type="button" @click="store.fetchActivities()">Reintentar</button>
        </p>

        <ul v-else class="list">
          <li v-for="activity in visibleActivities" :key="activity.id" class="row">
            <div class="row__main">
              <h3>{{ activity.activityTypeName }}</h3>
              <p class="row__meta">
                {{ activity.durationMinutes }} min<template v-if="activity.distanceKm !== null"> · {{ activity.distanceKm }} km</template>
              </p>
              <p class="row__meta">{{ dateFormat.format(new Date(activity.performedAt)) }}</p>
            </div>
            <p class="row__points">
              <span v-if="activity.points === 0" class="row__unit" role="status">calculando...</span>
              <template v-else><span class="row__num">{{ activity.points }}</span><span class="row__unit">pts</span></template>
            </p>
            <button
              class="btn btn--text"
              type="button"
              :disabled="store.deletingId === activity.id"
              :aria-label="`Borrar ${activity.activityTypeName}`"
              @click="confirmDelete(activity.id, activity.activityTypeName)"
            >
              {{ store.deletingId === activity.id ? 'Borrando…' : 'Borrar' }}
            </button>
          </li>
        </ul>
        <nav v-if="pageCount > 1" aria-label="Paginación de actividades" class="pagination">
          <button class="btn btn--ghost" :disabled="page === 1" @click="page--">Anterior</button>
          <span>Página {{ page }} de {{ pageCount }}</span>
          <button class="btn btn--ghost" :disabled="page === pageCount" @click="page++">Siguiente</button>
        </nav>
        <p v-if="store.items.length > 0 && store.error" class="alert alert--error" role="alert">{{ store.error }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pagination { display:flex; align-items:center; justify-content:center; gap:1rem; margin-top:1rem; }
.total { text-align: right; }
.total__num {
  display: block;
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--track);
}
.total__label { color: var(--muted); font-size: 0.95rem; }

.layout { display: grid; gap: 1.5rem; align-items: start; }
@media (min-width: 52rem) {
  .layout { grid-template-columns: 20rem 1fr; }
}

.list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--line);
}
.row__meta { color: var(--muted); font-size: 0.95rem; }
.row__points { text-align: right; }
.row__num {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}
.row__unit { margin-left: 0.2rem; color: var(--muted); }
.retry { margin-left: 0.75rem; min-height: 2.25rem; }
</style>
