<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import FormField from '@/components/FormField.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')

const notice = computed<string | null>(() => {
  if (route.query.registered === '1') return 'Cuenta creada. Ya puedes iniciar sesión.'
  if (route.query.expired === '1') return 'Tu sesión expiró. Inicia sesión de nuevo.'
  return null
})

onMounted(() => auth.clearError())

function safeRedirect(): string {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
    ? target
    : '/activities'
}

async function submit(): Promise<void> {
  const ok = await auth.login({ email: email.value.trim(), password: password.value })
  if (ok) await router.push(safeRedirect())
}
</script>

<template>
  <AuthLayout title="Inicia sesión" subtitle="Registra tus entrenamientos y sube en el ranking.">
    <p v-if="notice" class="alert" role="status">{{ notice }}</p>
    <p v-if="auth.error" class="alert alert--error" role="alert">{{ auth.error }}</p>

    <form novalidate @submit.prevent="submit">
      <FormField id="email" v-model="email" label="Correo" type="email" autocomplete="email" required :errors="auth.fieldErrors.email" />
      <FormField id="password" v-model="password" label="Contraseña" type="password" autocomplete="current-password" required :errors="auth.fieldErrors.password" />
      <button class="btn btn--block" type="submit" :disabled="auth.loading">
        <span v-if="auth.loading" class="spinner" aria-hidden="true"></span>
        {{ auth.loading ? 'Entrando…' : 'Iniciar sesión' }}
      </button>
    </form>

    <template #alt>
      ¿Aún no tienes cuenta? <RouterLink :to="{ name: 'register' }">Crea una</RouterLink>
    </template>
  </AuthLayout>
</template>
