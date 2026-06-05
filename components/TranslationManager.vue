<script setup lang="ts">
interface Translation {
  language: string
  title: string
  content: string
  excerpt?: string
  isOriginal?: boolean
}

const props = defineProps<{
  slug: string
  originalLanguage?: string
}>()

const emit = defineEmits<{
  saved: [language: string]
  deleted: [language: string]
}>()

const { t } = useI18n()
const {
  languages,
  loading,
  fetchLanguages,
  getTranslations,
  saveTranslation,
  deleteTranslation,
  getMissingLanguages,
} = useMultiLanguage()

const translations = ref<Translation[]>([])
const showAddModal = ref(false)
const editingLanguage = ref<string | null>(null)

// 新翻译表单
const newTranslation = ref({
  language: '',
  title: '',
  content: '',
  excerpt: '',
})

// 获取翻译列表
async function loadTranslations() {
  translations.value = await getTranslations(props.slug)
}

// 获取可用的语言选项
const availableLanguages = computed(() => {
  return getMissingLanguages(translations.value)
})

// 开始添加翻译
function startAddTranslation() {
  newTranslation.value = {
    language: availableLanguages.value[0]?.code || '',
    title: '',
    content: '',
    excerpt: '',
  }
  showAddModal.value = true
}

// 开始编辑翻译
function startEditTranslation(translation: Translation) {
  editingLanguage.value = translation.language
  newTranslation.value = {
    language: translation.language,
    title: translation.title,
    content: translation.content,
    excerpt: translation.excerpt || '',
  }
  showAddModal.value = true
}

// 保存翻译
async function handleSave() {
  if (
    !newTranslation.value.language ||
    !newTranslation.value.title ||
    !newTranslation.value.content
  ) {
    return
  }

  const success = await saveTranslation(props.slug, newTranslation.value.language, {
    title: newTranslation.value.title,
    content: newTranslation.value.content,
    excerpt: newTranslation.value.excerpt,
  })

  if (success) {
    showAddModal.value = false
    editingLanguage.value = null
    await loadTranslations()
    emit('saved', newTranslation.value.language)
  }
}

// 删除翻译
async function handleDelete(language: string) {
  if (!confirm('确定要删除这个翻译吗？')) return

  const success = await deleteTranslation(props.slug, language)
  if (success) {
    await loadTranslations()
    emit('deleted', language)
  }
}

// 获取语言名称
function getLanguageName(code: string) {
  const lang = languages.value.find((l) => l.code === code)
  return lang?.nativeName || code
}

// 初始化
onMounted(async () => {
  await fetchLanguages()
  await loadTranslations()
})
</script>

<template>
  <div class="translation-manager">
    <div class="manager-header">
      <h3>{{ t('translations.title') }}</h3>
      <button
        v-if="availableLanguages.length > 0"
        class="btn btn-primary btn-sm"
        @click="startAddTranslation"
      >
        {{ t('translations.add') }}
      </button>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="translations.length === 0"
      class="empty-state"
    >
      <p>{{ t('translations.noTranslations') }}</p>
    </div>

    <div
      v-else
      class="translations-list"
    >
      <div
        v-for="translation in translations"
        :key="translation.language"
        class="translation-item"
      >
        <div class="translation-info">
          <span class="language-badge">
            {{ getLanguageName(translation.language) }}
          </span>
          <span
            v-if="translation.isOriginal"
            class="original-badge"
          >
            {{ t('translations.original') }}
          </span>
          <span class="translation-title">
            {{ translation.title }}
          </span>
        </div>

        <div class="translation-actions">
          <button
            class="btn-icon"
            :title="t('common.edit')"
            @click="startEditTranslation(translation)"
          >
            ✏️
          </button>
          <button
            v-if="!translation.isOriginal"
            class="btn-icon"
            :title="t('common.delete')"
            @click="handleDelete(translation.language)"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑翻译模态框 -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="modal-overlay"
        @click.self="showAddModal = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingLanguage ? t('translations.edit') : t('translations.add') }}</h2>
            <button
              class="btn-close"
              @click="showAddModal = false"
            >
              ×
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">{{ t('translations.language') }}</label>
              <select
                v-model="newTranslation.language"
                class="form-input"
                :disabled="!!editingLanguage"
              >
                <option
                  value=""
                  disabled
                >
                  {{ t('translations.selectLanguage') }}
                </option>
                <option
                  v-for="lang in editingLanguage ? languages : availableLanguages"
                  :key="lang.code"
                  :value="lang.code"
                >
                  {{ lang.nativeName }} ({{ lang.name }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('translations.translatedTitle') }}</label>
              <input
                v-model="newTranslation.title"
                type="text"
                class="form-input"
                :placeholder="t('translations.titlePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('translations.translatedContent') }}</label>
              <textarea
                v-model="newTranslation.content"
                class="form-input form-textarea"
                rows="10"
                :placeholder="t('translations.contentPlaceholder')"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('translations.excerpt') }}</label>
              <textarea
                v-model="newTranslation.excerpt"
                class="form-input"
                rows="3"
                :placeholder="t('translations.excerptPlaceholder')"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="showAddModal = false"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="btn btn-primary"
              @click="handleSave"
            >
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.translation-manager {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.manager-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.translations-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.translation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.translation-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.language-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
}

.original-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-sm);
}

.translation-title {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.translation-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.btn-icon:hover {
  opacity: 1;
}

.form-textarea {
  resize: vertical;
  min-height: 200px;
}
</style>
