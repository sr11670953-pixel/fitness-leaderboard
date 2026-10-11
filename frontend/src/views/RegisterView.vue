<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import FormField from '@/components/FormField.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const username = ref('')
const password = ref('')

onMounted(() => auth.clearError())

async function submit(): Promise<void> {
  const ok = await auth.register({
    email: email.value.trim(),
    username: username.value.trim(),
    password: password.value,
  })
  if (ok) await router.push({ name: 'login', query: { registered: '1' } })
}
</script>

<template>
  <AuthLayout title="Crea tu cuenta" subtitle="Gana puntos con cada actividad que registres.">
    <p v-if="auth.error" class="alert alert--error" role="alert">{{ auth.error }}</p>

    <form novalidate @submit.prevent="submit">
      <FormField id="email" v-model="email" label="Correo" type="email" autocomplete="email" required :errors="auth.fieldErrors.email" />
      <FormField
        id="username"
        v-model="username"
        label="Nombre de usuario"
        autocomplete="username"
        required
        hint="Entre 3 y 50 caracteres: letras, números y guion bajo."
        :errors="auth.fieldErrors.username"
      />
      <FormField
        id="password"
        v-model="password"
        label="Contraseña"
        type="password"
        autocomplete="new-password"
        required
        hint="Mínimo 8 caracteres."
        :errors="auth.fieldErrors.password"
      />
      <button class="btn btn--block" type="submit" :disabled="auth.loading">
        <span v-if="auth.loading" class="spinner" aria-hidden="true"></span>
        {{ auth.loading ? 'Creando cuenta…' : 'Crear cuenta' }}
      </button>
    </form>

    <template #alt>
      ¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Inicia sesión</RouterLink>
    </template>
  </AuthLayout>
</template>
