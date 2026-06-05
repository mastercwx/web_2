/**
 * 站点设置 Composable
 * 用于在前端获取公开的站点设置
 */
export function useSettings() {
  const settings = useState<Record<string, string>>('site-settings', () => ({}))
  const loading = ref(false)

  // 获取设置
  async function fetchSettings() {
    if (Object.keys(settings.value).length > 0) {
      return settings.value
    }

    loading.value = true
    try {
      const data = await $fetch<Record<string, string>>('/api/settings/public')
      settings.value = data
      return data
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {}
    } finally {
      loading.value = false
    }
  }

  // 获取单个设置
  function getSetting(key: string, defaultValue: string = ''): string {
    return settings.value[key] || defaultValue
  }

  // 获取站点名称
  function getSiteName(): string {
    return getSetting('site.name', 'HG Blog')
  }

  // 获取站点描述
  function getSiteDescription(): string {
    return getSetting('site.description', '')
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    fetchSettings,
    getSetting,
    getSiteName,
    getSiteDescription,
  }
}
