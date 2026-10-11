<script setup lang="ts">
import { computed } from 'vue'
import { mockLeaderboard } from '@/data/mockLeaderboard'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const numberFormat = new Intl.NumberFormat('es-CO')

const entries = computed(() =>
  mockLeaderboard.map((entry) => ({
    ...entry,
    isMe: auth.user?.username !== undefined && entry.username === auth.user.username,
  })),
)
</script>

<template>
  <div class="page">
    <div class="page__head">
      <div>
        <h1>Ranking</h1>
        <p class="page__lede">Quién lidera en puntos acumulados.</p>
      </div>
    </div>

    <p class="alert" role="note">
      Estos son datos de ejemplo. El ranking en vivo se conectará cuando el backend lo exponga.
    </p>

    <ol class="board">
      <li v-for="entry in entries" :key="entry.userId" class="entry" :class="[`entry--${entry.rank}`, { 'entry--me': entry.isMe }]">
        <span class="entry__rank"><span class="sr-only">Puesto </span>{{ entry.rank }}</span>
        <div class="entry__who">
          <h2>{{ entry.username }}</h2>
          <p class="entry__meta">{{ entry.activities }} actividades</p>
        </div>
        <p class="entry__points">
          <span class="entry__num">{{ numberFormat.format(entry.points) }}</span>
          <span class="entry__unit">pts</span>
        </p>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.board { margin: 0; padding: 0; list-style: none; background: var(--surface); border: 1px solid var(--line); }
.entry {
  display: grid;
  grid-template-columns: 4rem 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem 0.9rem 0;
  border-bottom: 1px solid var(--line);
  border-left: 6px solid transparent;
}
.entry:last-child { border-bottom: 0; }
.entry--1 { border-left-color: var(--gold); }
.entry--2 { border-left-color: var(--silver); }
.entry--3 { border-left-color: var(--bronze); }
.entry--me { background: var(--info-bg); }

.entry__rank {
  font-family: var(--font-display);
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  color: var(--muted);
}
.entry--1 .entry__rank { color: var(--gold); }
.entry--2 .entry__rank { color: var(--silver); }
.entry--3 .entry__rank { color: var(--bronze); }

.entry__who h2 { font-size: 1.4rem; }
.entry__meta { color: var(--muted); font-size: 0.95rem; }
.entry__points { text-align: right; }
.entry__num { font-family: var(--font-display); font-size: 2.25rem; font-weight: 700; line-height: 1; }
.entry__unit { margin-left: 0.2rem; color: var(--muted); }
</style>
