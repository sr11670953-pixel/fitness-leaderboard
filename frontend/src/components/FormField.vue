<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    type?: string
    autocomplete?: string
    errors?: string[]
    hint?: string
    required?: boolean
    min?: string | number
    max?: string | number
    step?: string | number
  }>(),
  { type: 'text', autocomplete: undefined, errors: () => [], hint: undefined, required: false, min: undefined, max: undefined, step: undefined },
)

const model = defineModel<string>({ required: true })

const hasErrors = computed(() => props.errors.length > 0)

// Se maneja el valor a mano para que siempre sea texto, también en campos type="number".
function onInput(event: Event): void {
  if (event.target instanceof HTMLInputElement) {
    model.value = event.target.value
  }
}
</script>

<template>
  <div class="field" :class="{ 'field--invalid': hasErrors }">
    <label :for="props.id">{{ props.label }}</label>
    <input
      :id="props.id"
      :value="model"
      :type="props.type"
      :autocomplete="props.autocomplete"
      :required="props.required"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :aria-invalid="hasErrors"
      :aria-describedby="`${props.id}-msg`"
      @input="onInput"
    />
    <div :id="`${props.id}-msg`">
      <p v-if="props.hint" class="field__hint">{{ props.hint }}</p>
      <p v-for="message in props.errors" :key="message" class="field__error">{{ message }}</p>
    </div>
  </div>
</template>
