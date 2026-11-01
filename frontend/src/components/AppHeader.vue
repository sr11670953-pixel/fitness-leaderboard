<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="bar">
    <div class="bar__inner">
      <RouterLink class="brand" :to="{ name: 'activities' }">
        <svg class="brand__mark" viewBox="0 0 28 20" aria-hidden="true">
          <rect x="0" y="1" width="28" height="3" />
          <rect x="0" y="8.5" width="20" height="3" />
          <rect x="0" y="16" width="12" height="3" />
        </svg>
        <span class="brand__name">Fitness Leaderboard</span>
      </RouterLink>

      <nav v-if="auth.isAuthenticated" class="bar__nav" aria-label="Principal">
        <RouterLink :to="{ name: 'activities' }">Actividades</RouterLink>
        <RouterLink :to="{ name: 'leaderboard' }">Ranking</RouterLink>
        <RouterLink :to="{ name: 'challenges' }">Retos</RouterLink>
        <RouterLink :to="{ name: 'account' }">{{ auth.user?.username ?? 'Mi cuenta' }}</RouterLink>
        <button class="btn btn--ghost bar__logout" type="button" :disabled="auth.loading" @click="handleLogout">
          Cerrar sesión
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.bar {
  background: var(--ink);
  color: #fff;
}
.bar__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  width: min(100% - 2rem, 62rem);
  margin-inline: auto;
  padding-block: 0.75rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: #fff;
  text-decoration: none;
}
.brand__mark { width: 1.75rem; fill: #fff; }
.brand__name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
}
.bar__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1.25rem;
}
.bar__nav a {
  padding: 0.35rem 0;
  border-bottom: 3px solid transparent;
  color: #cfd8e3;
  text-decoration: none;
}
.bar__nav a:hover { color: #fff; }
.bar__nav a.router-link-active {
  border-bottom-color: #fff;
  color: #fff;
}
.bar__logout {
  min-height: 2.25rem;
  border-color: #cfd8e3;
  color: #fff;
}
.bar__logout:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); color: #fff; }
.bar :focus-visible { outline-color: #fff; }
</style>
