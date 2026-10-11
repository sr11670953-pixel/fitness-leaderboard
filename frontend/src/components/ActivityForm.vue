<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormField from '@/components/FormField.vue'
import { useActivitiesStore } from '@/stores/activities'

const store = useActivitiesStore()

function nowForInput(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

const typeId = ref('')
const duration = ref('')
const distance = ref('')
const performedAt = ref(nowForInput())
const maxDate = ref(nowForInput())

// Selecciona el primer tipo cuando llegan desde el backend.
watch(
  () => store.types,
  (types) => {
    if (typeId.value === '' && types[0]) typeId.value = String(types[0].id)
  },
  { immediate: true },
)

const selectedType = computed(() => store.types.find((t) => String(t.id) === typeId.value))

const estimatedPoints = computed<number | null>(() => {
  const type = selectedType.value
  const minutes = Number(duration.value)
  if (!type || !Number.isFinite(minutes) || minutes <= 0) return null
  const km = distance.value.trim() === '' ? 0 : Number(distance.value)
  if (!Number.isFinite(km) || km < 0) return null
  return Math.round(minutes * type.pointsPerMinute + km * type.pointsPerKm)
})

async function submit(): Promise<void> {
  store.clearError()

  const minutes = Number(duration.value)
  if (duration.value.trim() === '' || !Number.isInteger(minutes) || minutes <= 0) {
    store.fieldErrors = { durationMinutes: ['Escribe la duración en minutos (un número entero mayor que 0).'] }
    return
  }

  const ok = await store.createActivity({
    activityTypeId: Number(typeId.value),
    durationMinutes: minutes,
    distanceKm: distance.value.trim() === '' ? null : Number(distance.value),
    performedAt: new Date(performedAt.value).toISOString(),
  })
  if (ok) {
    duration.value = ''
    distance.value = ''
    performedAt.value = nowForInput()
    maxDate.value = nowForInput()
  }
}
</script>

<template>
  <section class="panel" aria-labelledby="form-title">
    <h2 id="form-title">Registrar actividad</h2>

    <p v-if="store.error" class="alert alert--error" role="alert">{{ store.error }}</p>

    <form novalidate @submit.prevent="submit">
      <div class="field" :class="{ 'field--invalid': store.fieldErrors.activityTypeId }">
        <label for="type">Tipo de ejercicio</label>
        <select id="type" v-model="typeId" required :disabled="store.types.length === 0">
          <option v-for="type in store.types" :key="type.id" :value="String(type.id)">{{ type.name }}</option>
        </select>
        <p v-for="message in store.fieldErrors.activityTypeId" :key="message" class="field__error">{{ message }}</p>
      </div>

      <FormField id="duration" v-model="duration" label="Duración (minutos)" type="number" min="1" max="1440" step="1" required :errors="store.fieldErrors.durationMinutes" />
      <FormField
        id="distance"
        v-model="distance"
        label="Distancia (km)"
        type="number"
        min="0"
        max="1000"
        step="0.01"
        :hint="selectedType && selectedType.pointsPerKm > 0 ? 'Opcional. Suma puntos extra por cada km.' : 'Opcional. Este ejercicio no da puntos por distancia.'"
        :errors="store.fieldErrors.distanceKm"
      />
      <FormField id="performedAt" v-model="performedAt" label="Fecha y hora" type="datetime-local" :max="maxDate" required :errors="store.fieldErrors.performedAt" />

      <p v-if="estimatedPoints !== null" class="estimate">
        Ganarás aproximadamente <strong>{{ estimatedPoints }}</strong> puntos
      </p>

      <button class="btn btn--block" type="submit" :disabled="store.saving || store.types.length === 0">
        <span v-if="store.saving" class="spinner" aria-hidden="true"></span>
        {{ store.saving ? 'Guardando…' : 'Guardar actividad' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.estimate {
  margin-bottom: 1rem;
  color: var(--muted);
}
.estimate strong {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--ink);
}
</style>
