<template>
  <div class="feature-card">
    <div class="text-3xl mb-4">
      {{ icon }}
    </div>
    <h3 class="text-lg font-semibold text-primary mb-2">
      {{ title }}
    </h3>
    <p class="text-secondary">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  icon: '📦',
})
</script>

<style scoped>
.feature-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  transition: box-shadow var(--transition-normal);
}

.feature-card:hover {
  box-shadow: var(--shadow-lg);
}
</style>
