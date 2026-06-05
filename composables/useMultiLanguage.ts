interface Translation {
  language: string
  title: string
  content: string
  excerpt?: string
  isOriginal?: boolean
}

interface Language {
  code: string
  name: string
  nativeName: string
}

export function useMultiLanguage() {
  const { locale } = useI18n()
  const languages = ref<Language[]>([])
  const loading = ref(false)

  // 获取支持的语言列表
  async function fetchLanguages() {
    try {
      const response = await $fetch<{ data: Language[] }>('/api/translations/languages')
      languages.value = response.data
    } catch (error) {
      console.error('获取语言列表失败:', error)
    }
  }

  // 获取文章的翻译
  async function getTranslations(slug: string): Promise<Translation[]> {
    loading.value = true
    try {
      const response = await $fetch<{ data: Translation[] }>(`/api/posts/${slug}/translations`)
      return response.data
    } catch (error) {
      console.error('获取翻译失败:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // 保存翻译
  async function saveTranslation(
    slug: string,
    language: string,
    data: { title: string; content: string; excerpt?: string },
  ) {
    try {
      await $fetch(`/api/posts/${slug}/translations`, {
        method: 'POST',
        body: { language, ...data },
      })
      return true
    } catch (error) {
      console.error('保存翻译失败:', error)
      return false
    }
  }

  // 删除翻译
  async function deleteTranslation(slug: string, language: string) {
    try {
      await $fetch(`/api/posts/${slug}/translations/${language}`, {
        method: 'DELETE',
      })
      return true
    } catch (error) {
      console.error('删除翻译失败:', error)
      return false
    }
  }

  // 获取指定语言的翻译内容
  function getTranslationByLanguage(translations: Translation[], language: string) {
    return translations.find((t) => t.language === language)
  }

  // 获取当前语言的翻译
  function getCurrentTranslation(translations: Translation[]) {
    return getTranslationByLanguage(translations, locale.value)
  }

  // 检查是否有指定语言的翻译
  function hasTranslation(translations: Translation[], language: string) {
    return translations.some((t) => t.language === language)
  }

  // 获取缺失的语言列表
  function getMissingLanguages(translations: Translation[]) {
    const translatedLanguages = translations.map((t) => t.language)
    return languages.value.filter((lang) => !translatedLanguages.includes(lang.code))
  }

  return {
    languages,
    loading,
    fetchLanguages,
    getTranslations,
    saveTranslation,
    deleteTranslation,
    getTranslationByLanguage,
    getCurrentTranslation,
    hasTranslation,
    getMissingLanguages,
  }
}
