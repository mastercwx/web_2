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

    <!-- 分享 -->
    <button
      class="action-btn"
      @click="handleShare"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="action-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      <span class="action-text">分享</span>
    </button>

    <!-- 举报 -->
    <ReportButton
      v-if="authStore.isAuthenticated"
      target-type="post"
      :target-id="postId"
    />

    <!-- 分享弹窗 -->
    <Teleport to="body">
      <div
        v-if="showShare"
        class="share-overlay"
        @click="showShare = false"
      >
        <div
          class="share-modal"
          @click.stop
        >
          <h3 class="share-title">分享到</h3>
          <div class="share-options">
            <button
              class="share-option"
              @click="shareTo('twitter')"
            >
              <span class="share-option-icon">𝕏</span>
              <span>Twitter</span>
            </button>
            <button
              class="share-option"
              @click="shareTo('weibo')"
            >
              <span class="share-option-icon">微</span>
              <span>微博</span>
            </button>
            <button
              class="share-option"
              @click="copyLink"
            >
              <span class="share-option-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <span>{{ copied ? '已复制!' : '复制链接' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  postId: number
  title?: string
  slug?: string
}>()

const authStore = useAuthStore()

const isLiked = ref(false)
const isFavorited = ref(false)
const likeCount = ref(0)
const favoriteCount = ref(0)
const likeLoading = ref(false)
const favoriteLoading = ref(false)
const showShare = ref(false)
const copied = ref(false)

// 获取初始状态
onMounted(async () => {
  try {
    const [likeData, favData] = await Promise.all([
      $fetch(`/api/likes/status?postId=${props.postId}`).catch(() => null),
      $fetch(`/api/favorites/status?postId=${props.postId}`).catch(() => null),
    ])
    if (likeData && (likeData as any).success) {
      isLiked.value = (likeData as any).data.liked
      likeCount.value = (likeData as any).data.count
    }
    if (favData && (favData as any).success) {
      isFavorited.value = (favData as any).data.favorited
      favoriteCount.value = (favData as any).data.count
    }
  } catch {
    // ignore
  }
})

const shareUrl = computed(() => {
  if (typeof window !== 'undefined' && props.slug) {
    return `${window.location.origin}/posts/${props.slug}`
  }
  return ''
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

    if ((data as any).success) {
      isLiked.value = (data as any).data.liked
      likeCount.value = (data as any).data.count
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

    if ((data as any).success) {
      isFavorited.value = (data as any).data.favorited
      favoriteCount.value = (data as any).data.count
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
  } finally {
    favoriteLoading.value = false
  }
}

function handleShare() {
  if (navigator.share) {
    navigator
      .share({
        title: props.title || '',
        url: shareUrl.value,
      })
      .catch(() => {})
  } else {
    showShare.value = true
  }
}

function shareTo(platform: string) {
  const url = encodeURIComponent(shareUrl.value)
  const text = encodeURIComponent(props.title || '')
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    weibo: `https://service.weibo.com/share/share.php?title=${text}&url=${url}`,
  }
  if (urls[platform]) {
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }
  showShare.value = false
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
      showShare.value = false
    }, 1500)
  } catch {
    // fallback
  }
}
</script>

<style scoped>
.post-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 0 0;
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-color);
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

.action-text {
  font-weight: 500;
}

/* 分享弹窗 */
.share-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.share-modal {
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  min-width: 240px;
  box-shadow: var(--shadow-lg);
}

.share-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-align: center;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
  font-size: 0.875rem;
}

.share-option:hover {
  background: var(--bg-tertiary);
}

.share-option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>
