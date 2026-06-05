<template>
  <div class="search-page">
    <div class="search-header">
      <h1>{{ t('search.title') }}</h1>
      <p class="search-subtitle">
        {{ t('search.subtitle') }}
      </p>
    </div>

    <!-- 搜索框 -->
    <div class="search-box-wrapper">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="search-input"
          autocomplete="off"
          @input="onSearchInput"
          @keyup.enter="performSearch"
          @focus="showSuggestions = true"
        />
        <button
          class="search-btn"
          @click="performSearch"
        >
          {{ t('search.button') }}
        </button>
      </div>

      <!-- 搜索建议下拉 -->
      <div
        v-if="showSuggestions && (suggestions.length > 0 || hotTags.length > 0)"
        class="suggestions-dropdown"
      >
        <!-- 搜索建议 -->
        <div
          v-if="suggestions.length > 0"
          class="suggestions-section"
        >
          <div class="suggestions-title">
            {{ t('search.suggestions') }}
          </div>
          <div
            v-for="item in suggestions"
            :key="item.id"
            class="suggestion-item"
            @click="selectSuggestion(item)"
          >
            <span class="suggestion-icon">📄</span>
            <span class="suggestion-text">{{ item.text }}</span>
          </div>
        </div>

        <!-- 热门标签 -->
        <div
          v-if="hotTags.length > 0 && !searchQuery"
          class="suggestions-section"
        >
          <div class="suggestions-title">
            {{ t('search.hotTags') }}
          </div>
          <div
            v-for="tag in hotTags"
            :key="tag.id"
            class="suggestion-item"
            @click="searchByTag(tag.name)"
          >
            <span class="suggestion-icon">🏷️</span>
            <span class="suggestion-text">{{ tag.name }}</span>
            <span class="suggestion-count">{{ tag.count }} {{ t('search.posts') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div
      v-if="!hasSearched && searchHistory.length > 0"
      class="search-history"
    >
      <div class="history-header">
        <span class="history-title">{{ t('search.history') }}</span>
        <button
          class="clear-history"
          @click="clearHistory"
        >
          {{ t('search.clearHistory') }}
        </button>
      </div>
      <div class="history-tags">
        <span
          v-for="(item, index) in searchHistory"
          :key="index"
          class="history-tag"
          @click="searchFromHistory(item)"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <!-- 热门搜索（未搜索时显示） -->
    <div
      v-if="!hasSearched"
      class="hot-searches"
    >
      <h3>{{ t('search.hotSearches') }}</h3>
      <div class="hot-tags">
        <NuxtLink
          v-for="tag in hotSearchTags"
          :key="tag.id"
          :to="`/tags/${tag.name}`"
          class="hot-tag"
        >
          {{ tag.name }}
          <span class="hot-tag-count">{{ tag.count }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 筛选器 -->
    <div
      v-if="hasSearched"
      class="search-filters"
    >
      <div class="filter-group">
        <label>{{ t('search.sortBy') }}</label>
        <select
          v-model="sortBy"
          class="filter-select"
          @change="performSearch"
        >
          <option value="relevance">
            {{ t('search.sortRelevance') }}
          </option>
          <option value="date_desc">
            {{ t('search.sortDateDesc') }}
          </option>
          <option value="date_asc">
            {{ t('search.sortDateAsc') }}
          </option>
          <option value="likes">
            {{ t('search.sortLikes') }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>{{ t('search.dateRange') }}</label>
        <input
          v-model="dateFrom"
          type="date"
          class="filter-input"
          @change="performSearch"
        />
        <span>-</span>
        <input
          v-model="dateTo"
          type="date"
          class="filter-input"
          @change="performSearch"
        />
      </div>

      <div class="filter-group">
        <label>{{ t('search.author') }}</label>
        <input
          v-model="authorFilter"
          type="text"
          :placeholder="t('search.authorPlaceholder')"
          class="filter-input"
          @keyup.enter="performSearch"
        />
      </div>

      <button
        v-if="hasActiveFilters"
        class="clear-filters-btn"
        @click="clearAllFilters"
      >
        {{ t('search.clearFilters') }}
      </button>

      <div
        v-if="selectedTag"
        class="filter-tag"
      >
        <span>{{ t('search.tag') }}: {{ selectedTag }}</span>
        <button @click="clearTagFilter">×</button>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div
      v-if="hasSearched"
      class="search-results"
    >
      <div
        v-if="loading"
        class="loading"
      >
        <div class="loading-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div
        v-else-if="posts.length === 0"
        class="no-results"
      >
        <div class="no-results-icon">🔍</div>
        <p>{{ t('search.noResults', { query: lastSearchQuery }) }}</p>
        <p class="no-results-hint">
          {{ t('search.tryOtherKeywords') }}
        </p>
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
              v-html="highlightText(post.excerpt)"
            />

            <div class="post-meta">
              <img
                :src="post.author.avatar || '/default-avatar.png'"
                :alt="post.author.username"
                class="author-avatar"
              />
              <span class="author-name">{{ post.author.username }}</span>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              <span class="post-stats">
                ❤️ {{ post.likesCount }} · 💬 {{ post.commentsCount }}
              </span>
            </div>

            <div
              v-if="post.tags.length > 0"
              class="post-tags"
            >
              <span
                v-for="tag in post.tags"
                :key="tag.id"
                class="tag"
                @click="searchByTag(tag.name)"
              >
                {{ tag.name }}
              </span>
            </div>
          </article>
        </div>

        <!-- 分页 -->
        <div
          v-if="totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="currentPage <= 1"
            class="page-btn"
            @click="goToPage(1)"
          >
            «
          </button>
          <button
            :disabled="currentPage <= 1"
            class="page-btn"
            @click="goToPage(currentPage - 1)"
          >
            ‹
          </button>

          <template
            v-for="pageNum in displayPages"
            :key="pageNum"
          >
            <span
              v-if="pageNum === '...'"
              class="page-ellipsis"
            >
              ...
            </span>
            <button
              v-else
              :class="['page-btn', { active: pageNum === currentPage }]"
              @click="goToPage(pageNum as number)"
            >
              {{ pageNum }}
            </button>
          </template>

          <button
            :disabled="currentPage >= totalPages"
            class="page-btn"
            @click="goToPage(currentPage + 1)"
          >
            ›
          </button>
          <button
            :disabled="currentPage >= totalPages"
            class="page-btn"
            @click="goToPage(totalPages)"
          >
            »
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

interface SearchPost {
  id: number
  title: string
  slug: string
  excerpt: string
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
  likesCount: number
  commentsCount: number
}

interface Suggestion {
  type: string
  id: number
  text: string
  slug?: string
  count?: number
}

const searchQuery = ref((route.query['q'] as string) || '')
const lastSearchQuery = ref('')
const posts = ref<SearchPost[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const currentPage = ref(Number(route.query['page']) || 1)
const totalPages = ref(0)
const total = ref(0)
const sortBy = ref((route.query['sortBy'] as string) || 'relevance')
const selectedTag = ref((route.query['tag'] as string) || '')
const dateFrom = ref((route.query['dateFrom'] as string) || '')
const dateTo = ref((route.query['dateTo'] as string) || '')
const authorFilter = ref((route.query['author'] as string) || '')

// 计算是否有激活的筛选器
const hasActiveFilters = computed(() => {
  return dateFrom.value || dateTo.value || authorFilter.value || selectedTag.value
})

// 搜索建议
const showSuggestions = ref(false)
const suggestions = ref<Suggestion[]>([])
const hotTags = ref<Suggestion[]>([])
const hotSearchTags = ref<Array<{ id: number; name: string; count: number }>>([])
const searchHistory = ref<string[]>([])

// 防抖定时器
let debounceTimer: NodeJS.Timeout | null = null

// 计算显示的页码
const displayPages = computed(() => {
  const pages: Array<number | string> = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

// 加载搜索历史
const loadHistory = () => {
  if (import.meta.client) {
    const history = localStorage.getItem('search_history')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  }
}

// 保存搜索历史
const saveHistory = (query: string) => {
  if (import.meta.client) {
    const history = searchHistory.value.filter((h) => h !== query)
    history.unshift(query)
    searchHistory.value = history.slice(0, 10)
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  }
}

// 清除搜索历史
const clearHistory = () => {
  searchHistory.value = []
  if (import.meta.client) {
    localStorage.removeItem('search_history')
  }
}

// 从历史记录搜索
const searchFromHistory = (query: string) => {
  searchQuery.value = query
  performSearch()
}

// 防抖搜索输入
const onSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)

  if (searchQuery.value.length < 2) {
    suggestions.value = []
    return
  }

  debounceTimer = setTimeout(async () => {
    try {
      const data = await $fetch('/api/search/suggestions', {
        params: { q: searchQuery.value },
      })
      suggestions.value = (data as any).data.suggestions || []
      hotTags.value = (data as any).data.hotTags || []
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    }
  }, 300)
}

// 选择建议
const selectSuggestion = (item: Suggestion) => {
  if (item.type === 'post' && item.slug) {
    router.push(`/posts/${item.slug}`)
  } else {
    searchQuery.value = item.text
    performSearch()
  }
  showSuggestions.value = false
}

// 按标签搜索
const searchByTag = (tagName: string) => {
  selectedTag.value = tagName
  if (!searchQuery.value) {
    searchQuery.value = tagName
  }
  performSearch()
}

// 清除标签筛选
const clearTagFilter = () => {
  selectedTag.value = ''
  performSearch()
}

// 清除所有筛选器
const clearAllFilters = () => {
  dateFrom.value = ''
  dateTo.value = ''
  authorFilter.value = ''
  selectedTag.value = ''
  performSearch()
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  lastSearchQuery.value = searchQuery.value.trim()
  currentPage.value = 1
  hasSearched.value = true
  showSuggestions.value = false

  saveHistory(lastSearchQuery.value)
  await fetchResults()
}

// 获取搜索结果
const fetchResults = async () => {
  loading.value = true

  try {
    const params: Record<string, any> = {
      q: lastSearchQuery.value,
      page: currentPage.value,
      pageSize: 10,
      sortBy: sortBy.value,
    }

    if (selectedTag.value) {
      params.tag = selectedTag.value
    }

    if (dateFrom.value) {
      params.dateFrom = dateFrom.value
    }

    if (dateTo.value) {
      params.dateTo = dateTo.value
    }

    if (authorFilter.value) {
      params.author = authorFilter.value
    }

    const data = await $fetch('/api/search', { params })

    posts.value = (data as any).data.posts
    totalPages.value = (data as any).data.pagination.totalPages
    total.value = (data as any).data.pagination.total

    // 更新 URL
    router.push({
      query: {
        q: lastSearchQuery.value,
        page: currentPage.value.toString(),
        sortBy: sortBy.value,
        ...(selectedTag.value ? { tag: selectedTag.value } : {}),
        ...(dateFrom.value ? { dateFrom: dateFrom.value } : {}),
        ...(dateTo.value ? { dateTo: dateTo.value } : {}),
        ...(authorFilter.value ? { author: authorFilter.value } : {}),
      },
    })
  } catch (error) {
    console.error('Search failed:', error)
    posts.value = []
  } finally {
    loading.value = false
  }
}

// 跳转到指定页
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchResults()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 高亮文本
const highlightText = (text: string) => {
  if (!lastSearchQuery.value) return text

  const keywords = lastSearchQuery.value.split(/\s+/).filter((k) => k.length > 0)
  let result = text

  for (const keyword of keywords) {
    const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }

  return result
}

// 转义正则特殊字符
const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 加载热门搜索
const loadHotSearches = async () => {
  try {
    const data = await $fetch('/api/search/hot')
    hotSearchTags.value = (data as any).data.hotTags || []
  } catch (err) {
    console.error('Failed to load hot searches:', err)
  }
}

// 点击外部关闭建议
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.search-box-wrapper')) {
    showSuggestions.value = false
  }
}

// 初始化
onMounted(() => {
  loadHistory()
  loadHotSearches()

  if (import.meta.client) {
    document.addEventListener('click', handleClickOutside)
  }

  // 如果 URL 中有查询参数，自动搜索
  if (route.query['q']) {
    performSearch()
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside)
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
  margin-bottom: 2rem;
}

.search-header h1 {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.search-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* 搜索框 */
.search-box-wrapper {
  position: relative;
  max-width: 700px;
  margin: 0 auto 2rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  font-size: 1.1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
}

.search-btn {
  padding: 0.875rem 2rem;
  font-size: 1.1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.search-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* 搜索建议下拉 */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-top: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
}

.suggestions-section {
  padding: 0.5rem 0;
}

.suggestions-title {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: var(--bg-secondary);
}

.suggestion-icon {
  font-size: 1rem;
}

.suggestion-text {
  flex: 1;
  color: var(--text-primary);
}

.suggestion-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 搜索历史 */
.search-history {
  max-width: 700px;
  margin: 0 auto 2rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.clear-history {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-history:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-tag {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.history-tag:hover {
  background: var(--primary-color);
  color: white;
}

/* 热门搜索 */
.hot-searches {
  max-width: 700px;
  margin: 0 auto 2rem;
}

.hot-searches h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hot-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s;
}

.hot-tag:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.hot-tag-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
}

/* 筛选器 */
.search-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  max-width: 150px;
}

.filter-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.clear-filters-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
}

.filter-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
}

/* 搜索结果 */
.search-results {
  margin-top: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-results {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-results-hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
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
  transition: all 0.2s;
}

.post-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.post-title-link {
  text-decoration: none;
  color: inherit;
}

.post-title {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
  transition: color 0.2s;
}

.post-card:hover .post-title {
  color: var(--primary-color);
}

.post-excerpt {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.post-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.post-stats {
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--text-secondary);
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
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: var(--primary-color);
  color: white;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem 0;
}

.page-btn {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
  font-size: 0.9rem;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-ellipsis {
  color: var(--text-secondary);
  padding: 0 0.25rem;
}

:deep(mark) {
  background: var(--primary-color);
  color: white;
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .search-header h1 {
    font-size: 1.75rem;
  }

  .search-box {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }

  .search-filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-meta {
    flex-wrap: wrap;
  }

  .post-stats {
    margin-left: 0;
    width: 100%;
  }
}
</style>
