<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface UserProfile {
  id: number
  username: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
  _count: {
    posts: number
    comments: number
    likes: number
    favorites: number
    followers: number
    following: number
  }
}

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
const authStore = useAuthStore()

const userId = computed(() => Number(route.params['id']))
const isSelf = computed(() => authStore.user?.id === userId.value)

const { data: user, error } = await useFetch<UserProfile>(`/api/users/${userId.value}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    message: error.value.message || '用户不存在',
  })
}

const activeTab = ref<'posts' | 'favorites' | 'likes' | 'history'>('posts')

const posts = ref<Post[]>([])
const postsPagination = ref<Pagination | null>(null)
const postsLoading = ref(false)

const favorites = ref<Post[]>([])
const favoritesPagination = ref<Pagination | null>(null)
const favoritesLoading = ref(false)

const likes = ref<Post[]>([])
const likesPagination = ref<Pagination | null>(null)
const likesLoading = ref(false)

interface HistoryItem {
  id: number
  readAt: string
  post: Post
}

const history = ref<HistoryItem[]>([])
const historyPagination = ref<Pagination | null>(null)
const historyLoading = ref(false)

async function fetchPosts(page = 1) {
  postsLoading.value = true
  try {
    const data = await $fetch<{ posts: Post[]; pagination: Pagination }>(
      `/api/users/${userId.value}/posts`,
      { params: { page, pageSize: 10 } },
    )
    posts.value = data.posts
    postsPagination.value = data.pagination
  } catch (err: any) {
    console.error('Failed to fetch posts:', err)
  } finally {
    postsLoading.value = false
  }
}

async function fetchFavorites(page = 1) {
  if (!isSelf.value) return
  favoritesLoading.value = true
  try {
    const data = await $fetch<{ favorites: Post[]; pagination: Pagination }>(
      `/api/users/${userId.value}/favorites`,
      {
        params: { page, pageSize: 10 },
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )
    favorites.value = data.favorites
    favoritesPagination.value = data.pagination
  } catch (err: any) {
    console.error('Failed to fetch favorites:', err)
  } finally {
    favoritesLoading.value = false
  }
}

async function fetchLikes(page = 1) {
  if (!isSelf.value) return
  likesLoading.value = true
  try {
    const data = await $fetch<{ likes: Post[]; pagination: Pagination }>(
      `/api/users/${userId.value}/likes`,
      {
        params: { page, pageSize: 10 },
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )
    likes.value = data.likes
    likesPagination.value = data.pagination
  } catch (err: any) {
    console.error('Failed to fetch likes:', err)
  } finally {
    likesLoading.value = false
  }
}

async function fetchHistory(page = 1) {
  if (!isSelf.value) return
  historyLoading.value = true
  try {
    const data = await $fetch<{ history: HistoryItem[]; pagination: Pagination }>(
      `/api/users/${userId.value}/reading-history`,
      {
        params: { page, pageSize: 10 },
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )
    history.value = data.history
    historyPagination.value = data.pagination
  } catch (err: any) {
    console.error('Failed to fetch history:', err)
  } finally {
    historyLoading.value = false
  }
}

function handleTabChange(tab: 'posts' | 'favorites' | 'likes' | 'history') {
  activeTab.value = tab
  if (tab === 'posts' && posts.value.length === 0) {
    fetchPosts()
  } else if (tab === 'favorites' && favorites.value.length === 0) {
    fetchFavorites()
  } else if (tab === 'likes' && likes.value.length === 0) {
    fetchLikes()
  } else if (tab === 'history' && history.value.length === 0) {
    fetchHistory()
  }
}

function handlePostsPageChange(page: number) {
  fetchPosts(page)
}

function handleFavoritesPageChange(page: number) {
  fetchFavorites(page)
}

function handleLikesPageChange(page: number) {
  fetchLikes(page)
}

function handleHistoryPageChange(page: number) {
  fetchHistory(page)
}

async function clearHistory() {
  if (!confirm('确定要清空阅读历史吗？')) return
  try {
    await $fetch('/api/reading-history/clear', { method: 'DELETE' })
    history.value = []
    historyPagination.value = null
  } catch (err: any) {
    console.error('Failed to clear history:', err)
  }
}

async function deleteHistoryItem(id: number) {
  try {
    await $fetch(`/api/reading-history/${id}`, { method: 'DELETE' })
    history.value = history.value.filter((item) => item.id !== id)
  } catch (err: any) {
    console.error('Failed to delete history item:', err)
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getInitials(username: string) {
  return username.charAt(0).toUpperCase()
}

// 初始加载
await fetchPosts()
</script>

<template>
  <div
    v-if="user"
    class="profile-page"
  >
    <!-- 用户信息卡片 -->
    <div class="profile-header card">
      <div class="profile-avatar">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.username"
        />
        <div
          v-else
          class="avatar-placeholder"
        >
          {{ getInitials(user.username) }}
        </div>
      </div>

      <div class="profile-info">
        <div class="profile-name-row">
          <h1>{{ user.username }}</h1>
          <FollowButton :user-id="user.id" />
        </div>
        <p class="profile-role">
          {{ user.role === 'ADMIN' ? '管理员' : '用户' }}
        </p>
        <p class="profile-joined">{{ t('user.joined') }}: {{ formatDate(user.createdAt) }}</p>
      </div>

      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ user._count.posts }}</span>
          <span class="stat-label">{{ t('user.posts') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ user._count.followers }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ user._count.following }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ user._count.comments }}</span>
          <span class="stat-label">{{ t('user.comments') }}</span>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="profile-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'posts' }"
        @click="handleTabChange('posts')"
      >
        {{ t('user.posts') }} ({{ user._count.posts }})
      </button>
      <button
        v-if="isSelf"
        class="tab-btn"
        :class="{ active: activeTab === 'favorites' }"
        @click="handleTabChange('favorites')"
      >
        {{ t('user.favorites') }} ({{ user._count.favorites }})
      </button>
      <button
        v-if="isSelf"
        class="tab-btn"
        :class="{ active: activeTab === 'likes' }"
        @click="handleTabChange('likes')"
      >
        {{ t('user.likes') }} ({{ user._count.likes }})
      </button>
      <button
        v-if="isSelf"
        class="tab-btn"
        :class="{ active: activeTab === 'history' }"
        @click="handleTabChange('history')"
      >
        {{ t('user.readingHistory') }}
      </button>
    </div>

    <!-- 文章列表 -->
    <div
      v-if="activeTab === 'posts'"
      class="tab-content"
    >
      <div
        v-if="postsLoading"
        class="loading"
      >
        {{ t('common.loading') }}
      </div>
      <div
        v-else-if="posts.length === 0"
        class="empty"
      >
        {{ t('user.noPosts') }}
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
              class="tag"
            >
              {{ tag.name }}
            </NuxtLink>
          </div>
        </article>

        <!-- 分页 -->
        <div
          v-if="postsPagination && postsPagination.totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="postsPagination.page <= 1"
            class="btn-secondary"
            @click="handlePostsPageChange(postsPagination.page - 1)"
          >
            {{ t('common.prev') }}
          </button>
          <span class="page-info">
            {{ postsPagination.page }} / {{ postsPagination.totalPages }}
          </span>
          <button
            :disabled="postsPagination.page >= postsPagination.totalPages"
            class="btn-secondary"
            @click="handlePostsPageChange(postsPagination.page + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 收藏列表 -->
    <div
      v-if="activeTab === 'favorites' && isSelf"
      class="tab-content"
    >
      <div
        v-if="favoritesLoading"
        class="loading"
      >
        {{ t('common.loading') }}
      </div>
      <div
        v-else-if="favorites.length === 0"
        class="empty"
      >
        {{ t('user.noFavorites') }}
      </div>
      <div
        v-else
        class="posts-list"
      >
        <article
          v-for="post in favorites"
          :key="post.id"
          class="post-card card"
        >
          <h3 class="post-title">
            <NuxtLink :to="`/posts/${post.slug}`">
              {{ post.title }}
            </NuxtLink>
          </h3>
          <p class="post-author">{{ t('posts.author') }}: {{ post.author.username }}</p>
          <p
            v-if="post.excerpt"
            class="post-excerpt"
          >
            {{ post.excerpt }}
          </p>
          <div class="post-meta">
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            <div class="post-stats">
              <span>💬 {{ post._count.comments }}</span>
              <span>❤️ {{ post._count.likes }}</span>
              <span>⭐ {{ post._count.favorites }}</span>
            </div>
          </div>
        </article>

        <div
          v-if="favoritesPagination && favoritesPagination.totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="favoritesPagination.page <= 1"
            class="btn-secondary"
            @click="handleFavoritesPageChange(favoritesPagination.page - 1)"
          >
            {{ t('common.prev') }}
          </button>
          <span class="page-info">
            {{ favoritesPagination.page }} / {{ favoritesPagination.totalPages }}
          </span>
          <button
            :disabled="favoritesPagination.page >= favoritesPagination.totalPages"
            class="btn-secondary"
            @click="handleFavoritesPageChange(favoritesPagination.page + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 点赞列表 -->
    <div
      v-if="activeTab === 'likes' && isSelf"
      class="tab-content"
    >
      <div
        v-if="likesLoading"
        class="loading"
      >
        {{ t('common.loading') }}
      </div>
      <div
        v-else-if="likes.length === 0"
        class="empty"
      >
        {{ t('user.noLikes') }}
      </div>
      <div
        v-else
        class="posts-list"
      >
        <article
          v-for="post in likes"
          :key="post.id"
          class="post-card card"
        >
          <h3 class="post-title">
            <NuxtLink :to="`/posts/${post.slug}`">
              {{ post.title }}
            </NuxtLink>
          </h3>
          <p class="post-author">{{ t('posts.author') }}: {{ post.author.username }}</p>
          <p
            v-if="post.excerpt"
            class="post-excerpt"
          >
            {{ post.excerpt }}
          </p>
          <div class="post-meta">
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            <div class="post-stats">
              <span>💬 {{ post._count.comments }}</span>
              <span>❤️ {{ post._count.likes }}</span>
              <span>⭐ {{ post._count.favorites }}</span>
            </div>
          </div>
        </article>

        <div
          v-if="likesPagination && likesPagination.totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="likesPagination.page <= 1"
            class="btn-secondary"
            @click="handleLikesPageChange(likesPagination.page - 1)"
          >
            {{ t('common.prev') }}
          </button>
          <span class="page-info">
            {{ likesPagination.page }} / {{ likesPagination.totalPages }}
          </span>
          <button
            :disabled="likesPagination.page >= likesPagination.totalPages"
            class="btn-secondary"
            @click="handleLikesPageChange(likesPagination.page + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 阅读历史 -->
    <div
      v-if="activeTab === 'history' && isSelf"
      class="tab-content"
    >
      <div class="history-header">
        <h3>{{ t('user.readingHistory') }}</h3>
        <button
          v-if="history.length > 0"
          class="btn-clear"
          @click="clearHistory"
        >
          {{ t('user.clearHistory') }}
        </button>
      </div>
      <div
        v-if="historyLoading"
        class="loading"
      >
        {{ t('common.loading') }}
      </div>
      <div
        v-else-if="history.length === 0"
        class="empty"
      >
        {{ t('user.noHistory') }}
      </div>
      <div
        v-else
        class="posts-list"
      >
        <article
          v-for="item in history"
          :key="item.id"
          class="post-card card"
        >
          <div class="history-item-header">
            <h3 class="post-title">
              <NuxtLink :to="`/posts/${item.post.slug}`">
                {{ item.post.title }}
              </NuxtLink>
            </h3>
            <button
              class="btn-delete"
              @click="deleteHistoryItem(item.id)"
            >
              ✕
            </button>
          </div>
          <p class="post-author">{{ t('posts.author') }}: {{ item.post.author.username }}</p>
          <p
            v-if="item.post.excerpt"
            class="post-excerpt"
          >
            {{ item.post.excerpt }}
          </p>
          <div class="post-meta">
            <span class="post-date">{{ t('user.readAt') }}: {{ formatDate(item.readAt) }}</span>
            <div class="post-stats">
              <span>💬 {{ item.post._count.comments }}</span>
              <span>❤️ {{ item.post._count.likes }}</span>
            </div>
          </div>
        </article>

        <div
          v-if="historyPagination && historyPagination.totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="historyPagination.page <= 1"
            class="btn-secondary"
            @click="handleHistoryPageChange(historyPagination.page - 1)"
          >
            {{ t('common.prev') }}
          </button>
          <span class="page-info">
            {{ historyPagination.page }} / {{ historyPagination.totalPages }}
          </span>
          <button
            :disabled="historyPagination.page >= historyPagination.totalPages"
            class="btn-secondary"
            @click="handleHistoryPageChange(historyPagination.page + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.profile-header {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.profile-info {
  flex: 1;
  min-width: 200px;
}

.profile-info h1 {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.profile-name-row h1 {
  margin: 0;
}

.profile-role {
  color: var(--color-primary);
  margin: 0 0 0.25rem;
  font-weight: 500;
}

.profile-joined {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.profile-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-content {
  min-height: 300px;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card {
  padding: 1.5rem;
}

.post-title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.post-title a {
  color: var(--text-primary);
  text-decoration: none;
}

.post-title a:hover {
  color: var(--color-primary);
}

.post-author {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 0.5rem;
}

.post-excerpt {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  line-height: 1.6;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
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
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 9999px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: none;
}

.tag:hover {
  background: var(--color-primary);
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
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
  border-radius: 0.375rem;
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

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.history-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-clear:hover {
  background: #dc2626;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.btn-delete {
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-delete:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-stats {
    justify-content: center;
  }

  .profile-tabs {
    overflow-x: auto;
  }
}
</style>
