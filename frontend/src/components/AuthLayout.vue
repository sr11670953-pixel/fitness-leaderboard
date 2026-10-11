<script setup lang="ts">
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <div class="auth">
    <section class="panel auth__panel">
      <h1>{{ title }}</h1>
      <p class="auth__sub">{{ subtitle }}</p>
      <slot />
    </section>
    <p class="auth__alt"><slot name="alt" /></p>
  </div>
</template>

<style scoped>
.auth {
  width: min(100% - 2rem, 26rem);
  margin: 3rem auto;
}
.auth__panel { padding: 1.75rem 1.5rem 2rem; }
.auth__sub { margin: 0.4rem 0 1.5rem; color: var(--muted); }
.auth__alt { margin-top: 1.25rem; text-align: center; }
</style>
