<script setup lang="ts">
const props = defineProps<{
  postId: number
}>()

const authStore = useAuthStore()

const liked = ref(false)
const likeCount = ref(0)
const favorited = ref(false)
const favoriteCount = ref(0)
const loading = ref(false)

// 获取点赞状态
async function fetchLikeStatus() {
  try {
    const data = await $fetch(`/api/likes/status?postId=${props.postId}`)
    const result = (data as any).data
    liked.value = result.liked
    likeCount.value = result.count
  } catch (error) {
    console.error('获取点赞状态失败:', error)
  }
}

// 获取收藏状态
async function fetchFavoriteStatus() {
  try {
    const data = await $fetch(`/api/favorites/status?postId=${props.postId}`)
    const result = (data as any).data
    favorited.value = result.favorited
    favoriteCount.value = result.count
  } catch (error) {
    console.error('获取收藏状态失败:', error)
  }
}

// 切换点赞
async function toggleLike() {
  if (!authStore.isAuthenticated) {
    alert('请先登录')
    return
  }

  loading.value = true
  try {
    const data = await $fetch('/api/likes/toggle', {
      method: 'POST',
      body: { postId: props.postId },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    const result = (data as any).data
    liked.value = result.liked
    likeCount.value += result.liked ? 1 : -1
  } catch (error: any) {
    alert(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 切换收藏
async function toggleFavorite() {
  if (!authStore.isAuthenticated) {
    alert('请先登录')
    return
  }

  loading.value = true
  try {
    const data = await $fetch('/api/favorites/toggle', {
      method: 'POST',
      body: { postId: props.postId },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    const result = (data as any).data
    favorited.value = result.favorited
    favoriteCount.value += result.favorited ? 1 : -1
  } catch (error: any) {
    alert(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchLikeStatus()
  fetchFavoriteStatus()
})
</script>

<template>
  <div class="post-actions">
    <button
      class="action-btn"
      :class="{ active: liked }"
      :disabled="loading"
      @click="toggleLike"
    >
      <span class="action-icon">{{ liked ? '❤️' : '🤍' }}</span>
      <span class="action-count">{{ likeCount }}</span>
    </button>

    <button
      class="action-btn"
      :class="{ active: favorited }"
      :disabled="loading"
      @click="toggleFavorite"
    >
      <span class="action-icon">{{ favorited ? '⭐' : '☆' }}</span>
      <span class="action-count">{{ favoriteCount }}</span>
    </button>
  </div>
</template>

<style scoped>
.post-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 1.25rem;
}

.action-count {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
