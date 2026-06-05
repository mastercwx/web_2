<template>
  <div class="related-posts">
    <h3 class="related-title">
      {{ $t('recommendations.related') }}
    </h3>

    <div
      v-if="loading"
      class="related-loading"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="skeleton-item"
      >
        <div class="skeleton-thumb" />
        <div class="skeleton-info">
          <div class="skeleton-name" />
          <div class="skeleton-meta" />
        </div>
      </div>
    </div>

    <div
      v-else-if="posts.length === 0"
      class="related-empty"
    >
      <p>{{ $t('recommendations.noRelated') }}</p>
    </div>

    <div
      v-else
      class="related-list"
    >
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="`/posts/${post.slug}`"
        class="related-item"
      >
        <div class="item-image">
          <img
            v-if="post.coverImage"
            :src="post.coverImage"
            :alt="post.title"
          />
          <div
            v-else
            class="image-placeholder"
          >
            <span>{{ post.title[0] }}</span>
          </div>
        </div>
        <div class="item-info">
          <h4 class="item-title">{{ post.title }}</h4>
          <div class="item-meta">
            <span class="meta-author">{{ post.author.username }}</span>
            <span
              v-if="showReason"
              class="meta-reason"
              >{{ post.reason }}</span
            >
          </div>
        </div>
      </NuxtLink>
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
  postId: number
  limit?: number
  showReason?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
  showReason: true,
})

const posts = ref<Post[]>([])
const loading = ref(false)

async function fetchRelatedPosts() {
  loading.value = true
  try {
    const data = await $fetch(`/api/recommendations/related/${props.postId}`, {
      params: { limit: props.limit },
    })

    if (data.success) {
      posts.value = data.data as unknown as Post[]
    }
  } catch (error) {
    console.error('Failed to fetch related posts:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRelatedPosts()
})
</script>

<style scoped>
.related-posts {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.related-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.related-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.skeleton-thumb {
  width: 80px;
  height: 60px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  height: 1rem;
  width: 70%;
  background: var(--bg-tertiary);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-meta {
  height: 0.75rem;
  width: 40%;
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

.related-empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-secondary);
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.related-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.related-item:hover {
  background: var(--bg-tertiary);
  transform: translateX(4px);
}

.item-image {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.meta-author {
  font-weight: 500;
}

.meta-reason {
  color: var(--color-primary);
}
</style>
