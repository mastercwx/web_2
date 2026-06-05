<script setup lang="ts">
interface Translation {
  language: string
  title: string
  content: string
  excerpt?: string
  isOriginal?: boolean
}

const props = defineProps<{
  translations: Translation[]
  currentLanguage: string
}>()

const emit = defineEmits<{
  switch: [language: string]
}>()

const { t } = useI18n()
const { languages, fetchLanguages } = useMultiLanguage()

// 获取可用的语言
const availableLanguages = computed(() => {
  return props.translations.map((translation) => {
    const lang = languages.value.find((l) => l.code === translation.language)
    return {
      code: translation.language,
      name: lang?.nativeName || translation.language,
      isOriginal: translation.isOriginal,
    }
  })
})

// 切换语言
function switchLanguage(language: string) {
  emit('switch', language)
}

// 初始化
onMounted(() => {
  fetchLanguages()
})
</script>

<template>
  <div class="post-language-switcher">
    <span class="switcher-label"> {{ t('translations.viewIn') }}: </span>
    <div class="switcher-buttons">
      <button
        v-for="lang in availableLanguages"
        :key="lang.code"
        :class="['lang-btn', { active: lang.code === currentLanguage }]"
        @click="switchLanguage(lang.code)"
      >
        {{ lang.name }}
        <span
          v-if="lang.isOriginal"
          class="original-dot"
          :title="t('translations.original')"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.post-language-switcher {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.switcher-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.switcher-buttons {
  display: flex;
  gap: 0.5rem;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.lang-btn:hover {
  border-color: var(--color-primary);
}

.lang-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.original-dot {
  width: 6px;
  height: 6px;
  background: var(--color-success);
  border-radius: 50%;
}
</style>
