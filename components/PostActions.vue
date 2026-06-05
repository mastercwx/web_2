<template>
  <div class="post-actions">
    <button
      :class="['action-btn', { active: isLiked }]"
      :disabled="likeLoading"
      @click="toggleLike"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="action-icon"
        :fill="isLiked ? 'currentColor' : 'none'"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span class="action-count">{{ likeCount }}</span>
    </button>

    <button
      :class="['action-btn', { active: isFavorited }]"
      :disabled="favoriteLoading"
      @click="toggleFavorite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="action-icon"
        :fill="isFavorited ? 'currentColor' : 'none'"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span class="action-count">{{ favoriteCount }}</span>
    </button>

    <ShareButton
      :title="title || ''"
      :url="shareUrl"
    />

    <ReportButton
      v-if="authStore.isAuthenticated"
      target-type="post"
      :target-id="postId"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  postId: number
  title?: string
  slug?: string
  initialLiked?: boolean
  initialFavorited?: boolean
  initialLikeCount?: number
  initialFavoriteCount?: number
}>()

const authStore = useAuthStore()

const isLiked = ref(props.initialLiked ?? false)
const isFavorited = ref(props.initialFavorited ?? false)
const likeCount = ref(props.initialLikeCount ?? 0)
const favoriteCount = ref(props.initialFavoriteCount ?? 0)
const likeLoading = ref(false)
const favoriteLoading = ref(false)

const shareUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/posts/${props.slug}`
  }
  return `/posts/${props.slug}`
})

async function toggleLike() {
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
    return
  }

  likeLoading.value = true
  try {
    const data = await $fetch('/api/likes/toggle', {
      method: 'POST',
      body: { postId: props.postId },
    })

    if (data.success) {
      isLiked.value = data.data.liked
      likeCount.value = data.data.count
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likeLoading.value = false
  }
}

async function toggleFavorite() {
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
    return
  }

  favoriteLoading.value = true
  try {
    const data = await $fetch('/api/favorites/toggle', {
      method: 'POST',
      body: { postId: props.postId },
    })

    if (data.success) {
      isFavorited.value = data.data.favorited
      favoriteCount.value = data.data.count
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
  } finally {
    favoriteLoading.value = false
  }
}
</script>

<style scoped>
.post-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 0.875rem;
}

.action-btn:hover {
  color: var(--color-brand);
  border-color: var(--color-brand);
  background: var(--bg-primary);
  transform: translateY(-1px);
}

.action-btn.active {
  color: #e85d75;
  border-color: #e85d75;
  background: rgba(232, 93, 117, 0.08);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-icon {
  width: 18px;
  height: 18px;
}

.action-count {
  font-weight: 500;
}
</style>
