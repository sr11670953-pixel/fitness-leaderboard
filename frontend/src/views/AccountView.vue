<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, parseApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { MeResponse, UserRole } from '@/types'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)

const NOT_AVAILABLE = 'No disponible'

const roleLabels: Record<UserRole, string> = {
  user: 'Usuario',
  admin: 'Administrador',
}

const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' })

function formatDate(value: string | undefined): string {
  if (!value) return NOT_AVAILABLE
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? NOT_AVAILABLE : dateFormat.format(date)
}

const fields = computed(() => {
  const user = auth.user
  if (!user) return []
  return [
    { label: 'Nombre de usuario', value: user.username ?? NOT_AVAILABLE },
    { label: 'Correo', value: user.email ?? NOT_AVAILABLE },
    { label: 'Rol', value: roleLabels[user.role] },
    { label: 'Miembro desde', value: formatDate(user.createdAt) },
    { label: 'ID', value: user.id },
  ]
})

const hasMissingFields = computed(() => fields.value.some((field) => field.value === NOT_AVAILABLE))

async function loadProfile(): Promise<void> {
  const current = auth.user
  if (!current) return

  loading.value = true
  error.value = null
  try {
    const { data } = await api.get<MeResponse>('/auth/me')
    // /auth/me solo trae id y role: conservamos email, username y createdAt.
    auth.user = { ...current, ...data.user }
  } catch (e) {
    error.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
}

async function handleLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <div class="page">
    <div class="page__head">
      <div>
        <h1>Mi cuenta</h1>
        <p class="page__lede">Los datos de tu sesión.</p>
      </div>
      <button class="btn btn--ghost" type="button" :disabled="loading || !auth.user" @click="loadProfile">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </div>

    <p v-if="loading" class="alert" role="status">
      <span class="spinner" aria-hidden="true"></span> Actualizando datos de la cuenta…
    </p>

    <p v-if="error" class="alert alert--error" role="alert">
      {{ error }}
      <button class="btn btn--ghost retry" type="button" @click="loadProfile">Reintentar</button>
    </p>

    <p v-if="!auth.user" class="empty">
      No hay datos de la cuenta. Inicia sesión de nuevo para verlos.
    </p>

    <template v-else>
      <dl class="profile">
        <div v-for="field in fields" :key="field.label" class="profile__row">
          <dt>{{ field.label }}</dt>
          <dd :class="{ profile__missing: field.value === NOT_AVAILABLE }">{{ field.value }}</dd>
        </div>
      </dl>

      <p v-if="hasMissingFields" class="alert note" role="note">
        Algunos datos solo llegan al iniciar sesión. Si recargaste la página, vuelve a entrar para verlos.
      </p>
    </template>

    <button class="btn btn--ghost logout" type="button" :disabled="auth.loading" @click="handleLogout">
      {{ auth.loading ? 'Cerrando sesión…' : 'Cerrar sesión' }}
    </button>
  </div>
</template>

<style scoped>
.retry { margin-left: 0.75rem; min-height: 2.25rem; }
.profile { margin: 0; background: var(--surface); border: 1px solid var(--line); }
.profile__row {
  display: grid;
  grid-template-columns: minmax(9rem, 14rem) 1fr;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--line);
}
.profile__row:last-child { border-bottom: 0; }
.profile dt { color: var(--muted); }
.profile dd { margin: 0; overflow-wrap: anywhere; }
.profile__missing { color: var(--muted); font-style: italic; }
.note { margin: 1rem 0 0; }
.logout { margin-top: 1.5rem; }
</style>
