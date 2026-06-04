<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  createdAt: string
  author: {
    id: number
    username: string
    avatar: string | null
  }
  tags: { id: number; name: string }[]
  _count: {
    comments: number
    likes: number
    favorites: number
  }
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const { t } = useI18n()
const route = useRoute()
const tagName = computed(() => route.params['name'] as string)

const posts = ref<Post[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const error = ref('')

// SEO
useSeo({
  title: `#${tagName.value}`,
  description: t('tags.postsCount', { count: pagination.value?.total || 0 }),
  url: `/tags/${tagName.value}`,
})

async function fetchPosts(page = 1) {
  loading.value = true
  error.value = ''

  try {
    const data = await $fetch<{
      tag: { id: number; name: string }
      posts: Post[]
      pagination: Pagination
    }>(`/api/tags/${tagName.value}/posts`, { params: { page, pageSize: 10 } })
    posts.value = data.posts
    pagination.value = data.pagination
  } catch (err: any) {
    error.value = err.data?.message || '加载失败'
    if (err.statusCode === 404) {
      throw createError({
        statusCode: 404,
        message: '标签不存在',
      })
    }
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  fetchPosts(page)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

await fetchPosts()
</script>

<template>
  <div class="tag-posts-page">
    <div class="page-header">
      <NuxtLink
        to="/tags"
        class="back-link"
      >
        ← {{ t('tags.backToTags') }}
      </NuxtLink>
      <h1>
        <span class="tag-icon">#</span>
        {{ tagName }}
      </h1>
      <p
        v-if="pagination"
        class="page-description"
      >
        {{ t('tags.postsCount', { count: pagination.total }) }}
      </p>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>

    <div
      v-else-if="posts.length === 0"
      class="empty"
    >
      {{ t('tags.noPosts') }}
    </div>

    <div
      v-else
      class="posts-list"
    >
      <article
        v-for="post in posts"
        :key="post.id"
        class="post-card card"
      >
        <h3 class="post-title">
          <NuxtLink :to="`/posts/${post.slug}`">
            {{ post.title }}
          </NuxtLink>
        </h3>
        <p
          v-if="post.excerpt"
          class="post-excerpt"
        >
          {{ post.excerpt }}
        </p>
        <div class="post-meta">
          <NuxtLink
            :to="`/users/${post.author.id}`"
            class="post-author"
          >
            {{ post.author.username }}
          </NuxtLink>
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          <div class="post-stats">
            <span>💬 {{ post._count.comments }}</span>
            <span>❤️ {{ post._count.likes }}</span>
            <span>⭐ {{ post._count.favorites }}</span>
          </div>
        </div>
        <div
          v-if="post.tags.length > 0"
          class="post-tags"
        >
          <NuxtLink
            v-for="tag in post.tags"
            :key="tag.id"
            :to="`/tags/${tag.name}`"
            class="tag-badge"
            :class="{ 'is-current': tag.name === tagName }"
          >
            {{ tag.name }}
          </NuxtLink>
        </div>
      </article>

      <!-- 分页 -->
      <div
        v-if="pagination && pagination.totalPages > 1"
        class="pagination"
      >
        <button
          :disabled="pagination.page <= 1"
          class="btn-secondary"
          @click="handlePageChange(pagination.page - 1)"
        >
          {{ t('common.prev') }}
        </button>
        <span class="page-info"> {{ pagination.page }} / {{ pagination.totalPages }} </span>
        <button
          :disabled="pagination.page >= pagination.totalPages"
          class="btn-secondary"
          @click="handlePageChange(pagination.page + 1)"
        >
          {{ t('common.next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag-posts-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-icon {
  color: var(--color-primary);
  font-weight: 700;
}

.page-description {
  color: var(--text-secondary);
  margin: 0;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.error {
  color: #dc2626;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  padding: 1.5rem;
}

.post-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
}

.post-title a {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.2s;
}

.post-title a:hover {
  color: var(--color-primary);
}

.post-excerpt {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  line-height: 1.6;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.post-author {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.post-author:hover {
  color: var(--color-primary);
}

.post-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-left: auto;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-badge {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 9999px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.tag-badge:hover {
  background: var(--color-primary);
  color: white;
}

.tag-badge.is-current {
  background: var(--color-primary);
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .post-stats {
    margin-left: 0;
  }
}
</style>
