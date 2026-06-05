<template>
  <div class="recommendation-feed">
    <div class="feed-header">
      <h2 class="feed-title">
        {{ title }}
      </h2>
      <div class="feed-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="feed-loading"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="skeleton-card"
      >
        <div class="skeleton-image" />
        <div class="skeleton-content">
          <div class="skeleton-title" />
          <div class="skeleton-text" />
        </div>
      </div>
    </div>

    <div
      v-else-if="posts.length === 0"
      class="feed-empty"
    >
      <p>{{ $t('recommendations.empty') }}</p>
    </div>

    <div
      v-else
      class="feed-grid"
    >
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post as any"
        :show-reason="showReason || false"
      />
    </div>

    <div
      v-if="hasMore && !loading"
      class="feed-more"
    >
      <button
        class="btn-load-more"
        @click="loadMore"
      >
        {{ $t('recommendations.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  author: {
    id: number
    username: string
    avatar: string | null
  }
  tags: { id: number; name: string }[]
  score: number
  reason: string
  createdAt: string
}

interface Props {
  title?: string
  showReason?: boolean
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showReason: false,
  limit: 20,
})

const { t } = useI18n()

const activeTab = ref('personal')
const posts = ref<Post[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const tabs = computed(() => [
  { id: 'personal', label: t('recommendations.tabs.personal') },
  { id: 'popular', label: t('recommendations.tabs.popular') },
])

const title = computed(() => props.title || t('recommendations.title'))

async function fetchPosts(reset = false) {
  if (reset) {
    page.value = 1
    posts.value = []
    hasMore.value = true
  }

  loading.value = true
  try {
    const endpoint =
      activeTab.value === 'popular' ? '/api/recommendations/popular' : '/api/recommendations/feed'

    const data = await $fetch(endpoint, {
      params: {
        limit: props.limit,
        page: page.value,
      },
    })

    if (data.success) {
      const newPosts = data.data as unknown as Post[]
      if (reset) {
        posts.value = newPosts
      } else {
        posts.value.push(...newPosts)
      }
      hasMore.value = newPosts.length >= props.limit
    }
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchPosts()
}

watch(activeTab, () => {
  fetchPosts(true)
})

onMounted(() => {
  fetchPosts(true)
})
</script>

<style scoped>
.recommendation-feed {
  margin-bottom: 2rem;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.feed-title {
  font-family: 'Averia Gruesa Libre', cursive;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.feed-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  background: var(--bg-secondary);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.tab-btn:hover {
  border-color: var(--color-brand);
  color: var(--color-primary);
}

.tab-btn.active {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #5b423f;
  font-weight: 600;
}

.feed-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-color);
}

.skeleton-image {
  height: 180px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-title {
  height: 1.25rem;
  width: 80%;
  background: var(--bg-tertiary);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-text {
  height: 1rem;
  width: 60%;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.feed-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.feed-more {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  padding: 0.75rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 0.9rem;
}

.btn-load-more:hover {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #5b423f;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
</style>
