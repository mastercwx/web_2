/**
 * A/B 测试 Composable
 */
export function useExperiment(experimentName: string) {
  const variant = ref<string | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  /**
   * 获取用户的实验变体
   */
  async function fetchVariant() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        loading.value = false
        return
      }

      const { data } = await useFetch<{
        code: number
        data: { experiment: string; variant: string | null }
      }>(`/api/experiments/variant/${experimentName}`)

      if (data.value?.code === 200) {
        variant.value = data.value.data.variant
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch experiment variant:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 跟踪实验事件
   */
  async function trackEvent(
    eventName: string,
    eventValue?: number,
    metadata?: Record<string, any>,
  ) {
    try {
      await $fetch('/api/experiments/track', {
        method: 'POST',
        body: {
          experimentName,
          eventName,
          eventValue,
          metadata,
        },
      })
    } catch (err) {
      console.error('Failed to track experiment event:', err)
    }
  }

  /**
   * 检查是否是特定变体
   */
  function isVariant(variantName: string): boolean {
    return variant.value === variantName
  }

  /**
   * 检查是否是控制组
   */
  function isControl(): boolean {
    return variant.value === 'control'
  }

  /**
   * 检查是否是实验组
   */
  function isTreatment(): boolean {
    return variant.value === 'treatment' || variant.value === 'enabled'
  }

  // 初始化
  onMounted(() => {
    fetchVariant()
  })

  return {
    variant,
    loading,
    error,
    fetchVariant,
    trackEvent,
    isVariant,
    isControl,
    isTreatment,
  }
}
