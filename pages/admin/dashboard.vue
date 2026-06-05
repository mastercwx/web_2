<template>
  <div class="dashboard-page">
    <h1>仪表盘</h1>

    <!-- 统计卡片 -->
    <div
      v-if="stats"
      class="stats-cards"
    >
      <div class="stat-card">
        <div class="stat-icon posts">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line
              x1="16"
              y1="13"
              x2="8"
              y2="13"
            />
            <line
              x1="16"
              y1="17"
              x2="8"
              y2="17"
            />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.total?.posts || 0 }}
          </div>
          <div class="stat-label">总文章数</div>
          <div class="stat-sub">
            已发布: {{ stats.total?.publishedPosts || 0 }} | 草稿:
            {{ stats.total?.draftPosts || 0 }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon comments">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.total?.comments || 0 }}
          </div>
          <div class="stat-label">总评论数</div>
          <div class="stat-sub">待审核: 0</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon users">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle
              cx="9"
              cy="7"
              r="4"
            />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.total?.users || 0 }}
          </div>
          <div class="stat-label">注册用户</div>
          <div class="stat-sub">今日新增: {{ stats.today?.users || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon tags">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
            />
            <line
              x1="7"
              y1="7"
              x2="7.01"
              y2="7"
            />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.total?.tags || 0 }}
          </div>
          <div class="stat-label">标签数</div>
          <div class="stat-sub">文章分类</div>
        </div>
      </div>
    </div>

    <!-- 今日数据 -->
    <div
      v-if="stats"
      class="section-title"
    >
      今日数据
    </div>
    <div
      v-if="stats"
      class="today-cards"
    >
      <div class="today-card">
        <span class="today-number">{{ stats.today?.posts || 0 }}</span>
        <span class="today-label">新文章</span>
      </div>
      <div class="today-card">
        <span class="today-number">{{ stats.today?.comments || 0 }}</span>
        <span class="today-label">新评论</span>
      </div>
      <div class="today-card">
        <span class="today-number">{{ stats.today?.users || 0 }}</span>
        <span class="today-label">新用户</span>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div
      v-if="stats"
      class="charts-section"
    >
      <div class="chart-container">
        <div class="chart-title">近7天文章发布趋势</div>
        <div class="bar-chart">
          <div
            v-for="item in stats.trend?.postsByDay || []"
            :key="item.date"
            class="bar-item"
          >
            <div
              class="bar"
              :style="{ height: getBarHeight(item.count, maxPosts) + '%' }"
            >
              <span class="bar-value">{{ item.count }}</span>
            </div>
            <div class="bar-label">
              {{ formatDate(item.date) }}
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-title">近7天评论趋势</div>
        <div class="bar-chart">
          <div
            v-for="item in stats.trend?.commentsByDay || []"
            :key="item.date"
            class="bar-item"
          >
            <div
              class="bar comments-bar"
              :style="{ height: getBarHeight(item.count, maxComments) + '%' }"
            >
              <span class="bar-value">{{ item.count }}</span>
            </div>
            <div class="bar-label">
              {{ formatDate(item.date) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门文章 -->
    <div
      v-if="popular"
      class="section-title"
    >
      热门文章
    </div>
    <div
      v-if="popular"
      class="popular-section"
    >
      <div class="popular-list">
        <h3>最新发布</h3>
        <div
          v-for="(post, index) in popular.recentPosts"
          :key="post.id"
          class="popular-item"
        >
          <span class="rank">{{ index + 1 }}</span>
          <NuxtLink
            :to="`/posts/${post.slug}`"
            class="popular-title"
            >{{ post.title }}</NuxtLink
          >
          <span class="popular-stat"
            >{{ post._count.comments }} 评论 | {{ post._count.likes }} 赞</span
          >
        </div>
      </div>

      <div class="popular-list">
        <h3>最多评论</h3>
        <div
          v-for="(post, index) in popular.topByComments"
          :key="post.id"
          class="popular-item"
        >
          <span class="rank">{{ index + 1 }}</span>
          <NuxtLink
            :to="`/posts/${post.slug}`"
            class="popular-title"
            >{{ post.title }}</NuxtLink
          >
          <span class="popular-stat">{{ post._count.comments }} 条评论</span>
        </div>
      </div>

      <div class="popular-list">
        <h3>最多点赞</h3>
        <div
          v-for="(post, index) in popular.topByLikes"
          :key="post.id"
          class="popular-item"
        >
          <span class="rank">{{ index + 1 }}</span>
          <NuxtLink
            :to="`/posts/${post.slug}`"
            class="popular-title"
            >{{ post.title }}</NuxtLink
          >
          <span class="popular-stat">{{ post._count.likes }} 个赞</span>
        </div>
      </div>
    </div>

    <!-- 活跃用户 -->
    <div
      v-if="popular"
      class="section-title"
    >
      活跃用户
    </div>
    <div
      v-if="popular"
      class="users-list"
    >
      <div
        v-for="user in popular.activeUsers"
        :key="user.id"
        class="user-item"
      >
        <div class="user-avatar">
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.username"
          />
          <div
            v-else
            class="avatar-placeholder"
          >
            {{ user.username?.[0]?.toUpperCase() || '?' }}
          </div>
        </div>
        <div class="user-info">
          <div class="user-name">
            {{ user.username }}
          </div>
          <div class="user-stats">
            {{ user._count.posts }} 篇文章 | {{ user._count.comments }} 条评论
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const authStore = useAuthStore()

// 检查管理员权限
if (!authStore.isAdmin) {
  throw createError({ statusCode: 403, message: t('error.forbidden') })
}

// 设置页面 SEO
useSeo({ title: '仪表盘' })

// 获取统计数据
const { data: stats } = await useFetch('/api/stats', {
  headers: useRequestHeaders(['cookie']),
})

// 获取热门文章
const { data: popular } = await useFetch('/api/stats/popular', {
  headers: useRequestHeaders(['cookie']),
  params: { limit: 5 },
})

// 计算图表最大值
const maxPosts = computed(() => {
  const values = stats.value?.trend?.postsByDay?.map((i) => i.count) || [0]
  return Math.max(...values, 1)
})

const maxComments = computed(() => {
  const values = stats.value?.trend?.commentsByDay?.map((i) => i.count) || [0]
  return Math.max(...values, 1)
})

// 计算柱状图高度
function getBarHeight(value: number, max: number): number {
  if (max === 0) return 0
  return Math.max((value / max) * 100, 5)
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2rem;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.posts {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.comments {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.users {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-icon.tags {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* 今日数据 */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.today-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.today-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.today-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.today-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.bar-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  gap: 0.5rem;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
  transition: height 0.3s ease;
}

.comments-bar {
  background: #10b981;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* 热门文章 */
.popular-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.popular-list {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
}

.popular-list h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.popular-item:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.popular-item:first-child .rank {
  background: var(--primary);
  color: #fff;
}

.popular-title {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popular-title:hover {
  color: var(--primary);
}

.popular-stat {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* 活跃用户 */
.users-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.user-item {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-stats {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .popular-section {
    grid-template-columns: 1fr;
  }

  .users-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 1rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .today-cards {
    flex-direction: column;
  }

  .users-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
