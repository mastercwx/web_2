<script setup lang="ts">
const themeStore = useThemeStore()

const themeIcon = computed(() => {
  switch (themeStore.theme) {
    case 'light':
      return '☀️'
    case 'dark':
      return '🌙'
    case 'system':
      return '💻'
    default:
      return '💻'
  }
})

const themeLabel = computed(() => {
  switch (themeStore.theme) {
    case 'light':
      return '浅色'
    case 'dark':
      return '深色'
    case 'system':
      return '跟随系统'
    default:
      return '跟随系统'
  }
})
</script>

<template>
  <button
    class="theme-switcher"
    :title="`当前: ${themeLabel}，点击切换`"
    @click="themeStore.toggleTheme()"
  >
    <span class="theme-icon">{{ themeIcon }}</span>
  </button>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-switcher:hover {
  background: var(--bg-tertiary);
  transform: scale(1.05);
}

.theme-icon {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
