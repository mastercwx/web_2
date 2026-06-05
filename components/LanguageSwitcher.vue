<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const currentLocale = computed(() => locale.value)

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map((l) => ({
    code: l.code,
    name: l.name,
  }))
})

function switchLocale(localeCode: string) {
  setLocale(localeCode as 'zh-CN' | 'en')
}
</script>

<template>
  <div class="language-switcher">
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      class="locale-btn"
      :class="{ active: currentLocale === loc.code }"
      @click="switchLocale(loc.code)"
    >
      {{ loc.name }}
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 0.25rem;
}

.locale-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.locale-btn:hover {
  color: var(--text-primary);
}

.locale-btn.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
</style>
