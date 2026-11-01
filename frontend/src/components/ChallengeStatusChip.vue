<script setup lang="ts">
import type { ChallengeStatus } from '@/types'

defineProps<{ status: ChallengeStatus; label: string }>()
</script>

<template>
  <span class="chip" :class="`chip--${status}`">{{ label }}</span>
</template>

<style scoped>
.chip {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border: 1.5px solid var(--muted);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.875rem;
  font-weight: 600;
}
.chip--active { border-color: var(--track); background: var(--info-bg); color: var(--track-deep); }
.chip--upcoming { border-color: var(--gold); color: var(--gold); }
</style>
