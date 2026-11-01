<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useLeaderboardStore } from '@/stores/leaderboard'

const auth = useAuthStore()
const board = useLeaderboardStore()
const { entries, connection, isSimulated, error, isLoading, isEmpty } = storeToRefs(board)

const numberFormat = new Intl.NumberFormat('es-CO')

const rows = computed(() =>
  entries.value.map((entry) => ({
    ...entry,
    isMe:
      (auth.user?.id !== undefined && entry.userId === auth.user.id) ||
      (auth.user?.username !== undefined && entry.username === auth.user.username),
  })),
)

const statusLabel = computed(() => {
  if (connection.value === 'open') return 'En vivo'
  if (connection.value === 'connecting') return 'Conectando…'
  if (connection.value === 'reconnecting') return 'Reconectando…'
  return 'Desconectado'
})

onMounted(() => {
  board.start()
})

onUnmounted(() => {
  board.stop()
})
</script>

<template>
  <div class="page">
    <div class="page__head">
      <div>
        <h1>Ranking</h1>
        <p class="page__lede">Quién lidera en puntos acumulados.</p>
      </div>
      <p class="status" :class="{ 'status--live': connection === 'open' }" role="status">
        <span class="status__dot" aria-hidden="true"></span>{{ statusLabel }}
      </p>
    </div>

    <p v-if="isSimulated" class="alert" role="note">
      Estos son datos de ejemplo que se mueven solos. El ranking real aparecerá cuando el backend
      exponga el WebSocket.
    </p>

    <p v-if="error" class="alert alert--error" role="alert">
      {{ error }}
      <button class="btn btn--ghost retry" type="button" @click="board.retry()">Reintentar ahora</button>
    </p>

    <p v-if="isLoading" class="empty" role="status">
      <span class="spinner" aria-hidden="true"></span> Cargando ranking…
    </p>

    <p v-else-if="isEmpty" class="empty">
      Todavía no hay puntos registrados. Registra una actividad para entrar al ranking.
    </p>

    <div v-else-if="rows.length > 0" class="table-wrap">
      <table class="board">
        <caption class="sr-only">Ranking por puntos acumulados</caption>
        <thead>
          <tr>
            <th scope="col" class="pos">Posición</th>
            <th scope="col">Usuario</th>
            <th scope="col" class="num">Puntos</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.userId"
            :class="[`entry--${row.position}`, { 'entry--me': row.isMe }]"
          >
            <td class="pos">{{ row.position }}</td>
            <th scope="row" class="who">
              {{ row.username }}<span v-if="row.isMe" class="who__me"> (tú)</span>
            </th>
            <td class="num">
              <span class="num__value">{{ numberFormat.format(row.points) }}</span>
              <span class="num__unit">pts</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.status { display: inline-flex; align-items: center; gap: 0.5rem; margin: 0; color: var(--muted); font-weight: 600; }
.status__dot { width: 0.65rem; height: 0.65rem; border-radius: 50%; background: var(--muted); }
.status--live { color: var(--ink); }
.status--live .status__dot { background: var(--ink); }

.retry { margin-left: 0.75rem; min-height: 2.25rem; }

.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); }
.board { width: 100%; border-collapse: collapse; }
.board th,
.board td {
  padding: 0.9rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--line);
}
.board thead th { color: var(--muted); font-size: 0.95rem; font-weight: 600; }
.board tbody tr:last-child > * { border-bottom: 0; }

.board .pos {
  width: 7rem;
  border-left: 6px solid transparent;
  text-align: center;
}
.board tbody .pos {
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--muted);
}
.entry--1 .pos { border-left-color: var(--gold); color: var(--gold); }
.entry--2 .pos { border-left-color: var(--silver); color: var(--silver); }
.entry--3 .pos { border-left-color: var(--bronze); color: var(--bronze); }
.entry--me { background: var(--info-bg); }

.board .who { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; }
.who__me { font-family: var(--font-body); font-size: 0.95rem; font-weight: 500; color: var(--muted); }

.board .num { text-align: right; white-space: nowrap; }
.num__value { font-family: var(--font-display); font-size: 2rem; font-weight: 700; line-height: 1; }
.num__unit { margin-left: 0.2rem; color: var(--muted); }
</style>
