<template>
  <div class="search-page">
    <div class="search-header">
      <h1>{{ t('search.title') }}</h1>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="search-input"
          @keyup.enter="performSearch"
        />
        <button
          class="search-btn"
          @click="performSearch"
        >
          {{ t('search.button') }}
        </button>
      </div>
    </div>

    <div
      v-if="hasSearched"
      class="search-results"
    >
      <div
        v-if="loading"
        class="loading"
      >
        {{ t('common.loading') }}
      </div>

      <div
        v-else-if="posts.length === 0"
        class="no-results"
      >
        <p>{{ t('search.noResults', { query: lastSearchQuery }) }}</p>
      </div>

      <div v-else>
        <p class="results-count">
          {{ t('search.resultsCount', { count: total, query: lastSearchQuery }) }}
        </p>

        <div class="posts-list">
          <article
            v-for="post in posts"
            :key="post.id"
            class="post-card"
          >
            <div class="post-meta">
              <img
                :src="post.author.avatar || '/default-avatar.png'"
                :alt="post.author.username"
                class="author-avatar"
              />
              <span class="author-name">{{ post.author.username }}</span>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            </div>

            <NuxtLink
              :to="`/posts/${post.slug}`"
              class="post-title-link"
            >
              <h2
                class="post-title"
                v-html="highlightText(post.title)"
              />
            </NuxtLink>

            <p
              class="post-excerpt"
              v-html="highlightText(getExcerpt(post.content))"
            />

            <div
              v-if="post.tags.length > 0"
              class="post-tags"
            >
              <NuxtLink
                v-for="tag in post.tags"
                :key="tag.id"
                :to="`/tags/${tag.name}`"
                class="tag"
              >
                {{ tag.name }}
              </NuxtLink>
            </div>
          </article>
        </div>

        <div
          v-if="totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="currentPage <= 1"
            class="page-btn"
            @click="goToPage(currentPage - 1)"
          >
            {{ t('common.prev') }}
          </button>

          <span class="page-info"> {{ currentPage }} / {{ totalPages }} </span>

          <button
            :disabled="currentPage >= totalPages"
            class="page-btn"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

interface Post {
  id: number
  title: string
  slug: string
  content: string
  createdAt: string
  author: {
    id: number
    username: string
    avatar: string | null
  }
  tags: Array<{
    id: number
    name: string
  }>
}

const searchQuery = ref((route.query['q'] as string) || '')
const lastSearchQuery = ref('')
const posts = ref<Post[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const currentPage = ref(Number(route.query['page']) || 1)
const totalPages = ref(0)
const total = ref(0)

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  lastSearchQuery.value = searchQuery.value.trim()
  currentPage.value = 1
  hasSearched.value = true

  await fetchResults()
}

const fetchResults = async () => {
  loading.value = true

  try {
    const data = await $fetch('/api/posts', {
      params: {
        search: lastSearchQuery.value,
        page: currentPage.value,
        pageSize: 10,
      },
    })

    posts.value = data.data.posts
    totalPages.value = data.data.pagination.totalPages
    total.value = data.data.pagination.total

    // 更新 URL
    router.push({
      query: {
        q: lastSearchQuery.value,
        page: currentPage.value.toString(),
      },
    })
  } catch (error) {
    console.error('Search failed:', error)
    posts.value = []
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchResults()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getExcerpt = (content: string, length = 200) => {
  if (content.length <= length) return content
  return content.substring(0, length) + '...'
}

const highlightText = (text: string) => {
  if (!lastSearchQuery.value) return text
  const regex = new RegExp(`(${escapeRegex(lastSearchQuery.value)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 如果 URL 中有查询参数，自动搜索
onMounted(() => {
  if (route.query['q']) {
    performSearch()
  }
})
</script>

<style scoped>
.search-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.search-header {
  text-align: center;
  margin-bottom: 3rem;
}

.search-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover {
  background: var(--primary-hover);
}

.search-results {
  margin-top: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.results-count {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
  color: var(--text-primary);
}

.post-date {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.post-title-link {
  text-decoration: none;
  color: inherit;
}

.post-title {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.post-title:hover {
  color: var(--primary-color);
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
}

.tag {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 20px;
  font-size: 0.8rem;
  text-decoration: none;
  transition: all 0.2s;
}

.tag:hover {
  background: var(--primary-color);
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

:deep(mark) {
  background: var(--primary-color);
  color: white;
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .search-box {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }
}
</style>
