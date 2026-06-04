<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id)

// 获取统计数据
const { data: statsData } = useFetch(`/api/users/${userId.value}/dashboard/stats`, {
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

// 获取活动时间线
const { data: activityData } = useFetch(`/api/users/${userId.value}/dashboard/activity`, {
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

// 获取热门文章
const { data: popularData } = useFetch(`/api/users/${userId.value}/dashboard/popular-posts`, {
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

// 获取粉丝增长数据
const { data: growthData } = useFetch(`/api/users/${userId.value}/dashboard/follower-growth`, {
  params: { days: 30 },
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const stats = computed(() => (statsData.value as any)?.data?.stats || {})
const monthly = computed(() => (statsData.value as any)?.data?.monthly || {})
const activities = computed(() => (activityData.value as any)?.data?.activities || [])
const popularPosts = computed(() => (popularData.value as any)?.data?.posts || [])
const followerGrowth = computed(() => (growthData.value as any)?.data?.growth || [])

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="text-2xl font-bold">📊 个人仪表盘</h1>
      <p class="text-secondary">欢迎回来，{{ authStore.user?.username }}！</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.publishedPostCount || 0 }}
          </div>
          <div class="stat-label">已发布文章</div>
          <div class="stat-monthly">本月 +{{ monthly.posts || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.commentCount || 0 }}
          </div>
          <div class="stat-label">评论数</div>
          <div class="stat-monthly">本月 +{{ monthly.comments || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">❤️</div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.likeCount || 0 }}
          </div>
          <div class="stat-label">获赞数</div>
          <div class="stat-monthly">本月 +{{ monthly.likes || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.followerCount || 0 }}
          </div>
          <div class="stat-label">粉丝数</div>
          <div class="stat-monthly">本月 +{{ monthly.followers || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 更多统计 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-item-label">总文章数</span>
        <span class="stat-item-value">{{ stats.postCount || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item-label">被收藏数</span>
        <span class="stat-item-value">{{ stats.favoriteCount || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item-label">总阅读量</span>
        <span class="stat-item-value">{{ stats.totalViews || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item-label">关注数</span>
        <span class="stat-item-value">{{ stats.followingCount || 0 }}</span>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 粉丝增长趋势 -->
      <div class="card">
        <h2 class="card-title">📈 粉丝增长趋势（近30天）</h2>
        <div class="growth-chart">
          <div
            v-if="followerGrowth.length > 0"
            class="chart-container"
          >
            <div
              v-for="(item, index) in followerGrowth"
              :key="item.date"
              class="chart-bar-wrapper"
              :title="`${item.date}: +${item.count} 粉丝`"
            >
              <div
                class="chart-bar"
                :style="{
                  height: `${Math.max(4, (item.count / Math.max(...followerGrowth.map((g) => g.count), 1)) * 100)}%`,
                }"
              />
              <span
                v-if="index % 5 === 0"
                class="chart-label"
              >
                {{ item.date.split('-')[1] }}/{{ item.date.split('-')[2] }}
              </span>
            </div>
          </div>
          <div
            v-else
            class="empty-state"
          >
            暂无数据
          </div>
        </div>
      </div>

      <!-- 热门文章 -->
      <div class="card">
        <h2 class="card-title">🔥 热门文章</h2>
        <div
          v-if="popularPosts.length === 0"
          class="empty-state"
        >
          暂无文章
        </div>
        <div
          v-else
          class="popular-posts"
        >
          <NuxtLink
            v-for="(post, index) in popularPosts"
            :key="post.id"
            :to="`/posts/${post.slug}`"
            class="popular-post-item"
          >
            <span class="post-rank">{{ index + 1 }}</span>
            <div class="post-info">
              <h3 class="post-title">
                {{ post.title }}
              </h3>
              <div class="post-stats">
                <span>❤️ {{ post.likeCount }}</span>
                <span>💬 {{ post.commentCount }}</span>
                <span>⭐ {{ post.favoriteCount }}</span>
                <span>👁️ {{ post.viewCount }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="card">
      <h2 class="card-title">🕐 最近活动</h2>
      <div
        v-if="activities.length === 0"
        class="empty-state"
      >
        暂无活动记录
      </div>
      <div
        v-else
        class="activity-timeline"
      >
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="activity-item"
        >
          <span class="activity-icon">{{ activity.icon }}</span>
          <div class="activity-content">
            <span class="activity-description">{{ activity.description }}</span>
            <span class="activity-time">{{ formatDate(activity.createdAt) }}</span>
          </div>
          <NuxtLink
            v-if="activity.link"
            :to="activity.link"
            class="activity-link"
          >
            查看 →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <NuxtLink
        to="/posts/create"
        class="action-btn"
      >
        ✏️ 写文章
      </NuxtLink>
      <NuxtLink
        to="/posts/drafts"
        class="action-btn"
      >
        📄 草稿箱
      </NuxtLink>
      <NuxtLink
        to="/notifications"
        class="action-btn"
      >
        🔔 通知中心
      </NuxtLink>
      <NuxtLink
        to="/settings"
        class="action-btn"
      >
        ⚙️ 个人设置
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: var(--text-secondary);
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.stat-monthly {
  font-size: 0.75rem;
  color: var(--color-success);
  margin-top: 0.25rem;
}

/* 更多统计行 */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.stat-item {
  flex: 1;
  min-width: 100px;
  text-align: center;
}

.stat-item-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-bottom: 0.25rem;
}

.stat-item-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* 内容区域 */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

/* 增长图表 */
.growth-chart {
  height: 200px;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
  padding-bottom: 1.5rem;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.chart-bar {
  width: 100%;
  max-width: 20px;
  background: var(--color-primary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: height 0.3s ease;
  margin-top: auto;
}

.chart-bar:hover {
  background: var(--color-primary-hover);
}

.chart-label {
  position: absolute;
  bottom: -1.25rem;
  font-size: 0.625rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* 热门文章 */
.popular-posts {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.popular-post-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background var(--transition-fast);
}

.popular-post-item:hover {
  background: var(--bg-tertiary);
}

.post-rank {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.post-info {
  flex: 1;
  min-width: 0;
}

.post-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-stats {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* 活动时间线 */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.activity-item:hover {
  background: var(--bg-secondary);
}

.activity-icon {
  font-size: 1.25rem;
  width: 2rem;
  text-align: center;
}

.activity-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.activity-description {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.activity-link {
  font-size: 0.75rem;
  color: var(--color-primary);
  text-decoration: none;
}

.activity-link:hover {
  text-decoration: underline;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  text-align: center;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-primary);
  color: var(--text-inverse);
  border-color: var(--color-primary);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-tertiary);
}
</style>
