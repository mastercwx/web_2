<template>
  <div class="drafts-page">
    <div class="page-header">
      <h1>{{ t('posts.drafts.title') }}</h1>
      <p class="page-description">
        {{ t('posts.drafts.description') }}
      </p>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="posts.length === 0"
      class="empty"
    >
      <p>{{ t('posts.drafts.noDrafts') }}</p>
      <NuxtLink
        to="/posts/create"
        class="btn-primary"
      >
        {{ t('posts.create') }}
      </NuxtLink>
    </div>

    <div
      v-else
      class="posts-list"
    >
      <article
        v-for="post in posts"
        :key="post.id"
        class="post-card"
      >
        <div class="post-header">
          <div class="post-status">
            <span
              v-if="post.published"
              class="status-badge published"
            >
              {{ t('posts.drafts.published') }}
            </span>
            <span
              v-else-if="post.scheduledAt"
              class="status-badge scheduled"
            >
              {{ t('posts.drafts.scheduled') }}
            </span>
            <span
              v-else
              class="status-badge draft"
            >
              {{ t('posts.drafts.draft') }}
            </span>
          </div>
          <div class="post-date">
            <span
              v-if="post.scheduledAt"
              class="scheduled-date"
            >
              {{ t('posts.drafts.scheduledFor') }}: {{ formatDateTime(post.scheduledAt) }}
            </span>
            <span class="created-date">
              {{ t('posts.drafts.createdAt') }}: {{ formatDate(post.createdAt) }}
            </span>
          </div>
        </div>

        <h2 class="post-title">
          <NuxtLink :to="`/posts/${post.slug}`">{{ post.title }}</NuxtLink>
        </h2>

        <p class="post-excerpt">
          {{ getExcerpt(post.content) }}
        </p>

        <div
          v-if="post.tags.length > 0"
          class="post-tags"
        >
          <span
            v-for="tag in post.tags"
            :key="tag.id"
            class="tag"
          >
            {{ tag.name }}
          </span>
        </div>

        <div class="post-actions">
          <NuxtLink
            :to="`/posts/${post.slug}/edit`"
            class="btn-edit"
          >
            {{ t('posts.detail.edit') }}
          </NuxtLink>
          <button
            class="btn-delete"
            @click="handleDelete(post.slug)"
          >
            {{ t('posts.detail.delete') }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { t } = useI18n()

interface Post {
  id: number
  title: string
  slug: string
  content: string
  published: boolean
  scheduledAt: string | null
  createdAt: string
  tags: Array<{ id: number; name: string }>
}

const posts = ref<Post[]>([])
const loading = ref(true)

async function fetchDrafts() {
  loading.value = true
  try {
    const data = await $fetch('/api/posts/my-drafts')
    posts.value = data.posts
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
  } finally {
    loading.value = false
  }
}

async function handleDelete(slug: string) {
  if (!confirm(t('posts.drafts.confirmDelete'))) {
    return
  }

  try {
    await $fetch(`/api/posts/${slug}`, { method: 'DELETE' })
    posts.value = posts.value.filter((p) => p.slug !== slug)
  } catch (error) {
    console.error('Failed to delete post:', error)
  }
}

function getExcerpt(content: string, length = 150) {
  if (content.length <= length) return content
  return content.substring(0, length) + '...'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchDrafts()
})
</script>

<style scoped>
.drafts-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty .btn-primary {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.post-card:hover {
  box-shadow: var(--shadow-md);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.published {
  background: #dcfce7;
  color: #166534;
}

.status-badge.scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.draft {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.post-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  gap: 1rem;
}

.scheduled-date {
  color: var(--color-primary);
  font-weight: 500;
}

.post-title {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.post-title a {
  color: var(--text-primary);
  text-decoration: none;
}

.post-title a:hover {
  color: var(--color-primary);
}

.post-excerpt {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.post-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn-edit {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: var(--border-color);
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #dc2626;
  border-radius: var(--radius-md);
  color: #dc2626;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
}
</style>
