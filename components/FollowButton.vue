<script setup lang="ts">
/**
 * 关注按钮组件
 */
const props = defineProps<{
  userId: number
  initialFollowing?: boolean
}>()

const authStore = useAuthStore()
const isFollowing = ref(props.initialFollowing || false)
const loading = ref(false)

// 检查关注状态
async function checkFollowStatus() {
  if (!authStore.isAuthenticated || authStore.user?.id === props.userId) {
    return
  }

  try {
    const data = await $fetch<{ isFollowing: boolean }>(`/api/follow/status/${props.userId}`)
    isFollowing.value = data.isFollowing
  } catch (error) {
    console.error('Failed to check follow status:', error)
  }
}

// 切换关注状态
async function toggleFollow() {
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
    return
  }

  loading.value = true
  try {
    const result = await $fetch<{ followed: boolean }>('/api/follow/toggle', {
      method: 'POST',
      body: { userId: props.userId },
    })
    isFollowing.value = result.followed
  } catch (error: any) {
    console.error('Failed to toggle follow:', error)
  } finally {
    loading.value = false
  }
}

// 是否是自己
const isSelf = computed(() => authStore.user?.id === props.userId)

onMounted(() => {
  if (props.initialFollowing === undefined) {
    checkFollowStatus()
  }
})
</script>

<template>
  <button
    v-if="!isSelf"
    :class="['follow-btn', { following: isFollowing }]"
    :disabled="loading"
    @click="toggleFollow"
  >
    <span
      v-if="loading"
      class="spinner"
    />
    <span v-else-if="isFollowing">✓ 已关注</span>
    <span v-else>+ 关注</span>
  </button>
</template>

<style scoped>
.follow-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.follow-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.follow-btn.following {
  background: transparent;
  color: var(--color-primary);
}

.follow-btn.following:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}

.follow-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
