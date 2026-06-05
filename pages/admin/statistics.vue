<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const authStore = useAuthStore()

// 视图模式
const activeView = ref<'overview' | 'content' | 'users' | 'engagement' | 'revenue'>('overview')

// 时间范围
const period = ref('month')
const periodOptions = [
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'week', label: '最近7天' },
  { value: 'month', label: '最近30天' },
  { value: 'quarter', label: '最近3个月' },
  { value: 'year', label: '最近1年' },
]

// 获取概览统计
const { data: overviewData, refresh: refreshOverview } = await useFetch(
  '/api/admin/statistics/overview',
  {
    query: { period },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  },
)

// 获取内容分析
const { data: contentData, refresh: refreshContent } = await useFetch(
  '/api/admin/statistics/content',
  {
    query: { period },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  },
)

// 获取用户分析
const { data: usersData, refresh: refreshUsers } = await useFetch('/api/admin/statistics/users', {
  query: { period },
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

// 获取参与度分析
const { data: engagementData, refresh: refreshEngagement } = await useFetch(
  '/api/admin/statistics/engagement',
  {
    query: { period },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  },
)

// 获取收入分析
const { data: revenueData, refresh: refreshRevenue } = await useFetch(
  '/api/admin/statistics/revenue',
  {
    query: { period },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  },
)

const overview = computed(() => (overviewData.value as any)?.data || {})
const content = computed(() => (contentData.value as any)?.data || {})
const users = computed(() => (usersData.value as any)?.data || {})
const engagement = computed(() => (engagementData.value as any)?.data || {})
const revenue = computed(() => (revenueData.value as any)?.data || {})

// 刷新数据
function refreshData() {
  switch (activeView.value) {
    case 'overview':
      refreshOverview()
      break
    case 'content':
      refreshContent()
      break
    case 'users':
      refreshUsers()
      break
    case 'engagement':
      refreshEngagement()
      break
    case 'revenue':
      refreshRevenue()
      break
  }
}

// 监听时间范围变化
watch(period, () => {
  refreshData()
})

// 切换视图
function switchView(view: typeof activeView.value) {
  activeView.value = view
  refreshData()
}

// 导出数据
async function handleExport(format: 'json' | 'csv') {
  try {
    const response = await $fetch('/api/admin/statistics/export', {
      query: {
        type: activeView.value,
        period: period.value,
        format,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (format === 'csv') {
      // 下载 CSV 文件
      const blob = new Blob([response as string], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statistics-${activeView.value}-${period.value}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      // 下载 JSON 文件
      const data = (response as any).data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statistics-${activeView.value}-${period.value}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  } catch (error: any) {
    alert(`导出失败：${error.message}`)
  }
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// 格式化百分比
function formatPercent(num: number): string {
  return num >= 0 ? `+${num}%` : `${num}%`
}

// 获取增长颜色
function getGrowthColor(num: number): string {
  if (num > 0) return 'text-green-600'
  if (num < 0) return 'text-red-600'
  return 'text-gray-600'
}

// 计算图表高度
function getChartHeight(value: number, max: number): number {
  if (max === 0) return 0
  return Math.max((value / max) * 100, 5)
}

// 获取最大值
function getMaxValue(data: any[], key: string): number {
  if (!data || data.length === 0) return 1
  return Math.max(...data.map((item) => item[key] || 0), 1)
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">高级统计分析</h1>
      <div class="flex items-center gap-4">
        <!-- 时间范围选择 -->
        <select
          v-model="period"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option
            v-for="option in periodOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <!-- 导出按钮 -->
        <div class="relative">
          <button
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            @click="handleExport('json')"
          >
            导出 JSON
          </button>
          <button
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm ml-2"
            @click="handleExport('csv')"
          >
            导出 CSV
          </button>
        </div>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="flex gap-2 border-b border-gray-200 pb-4">
      <button
        class="px-4 py-2 rounded-md transition-colors"
        :class="
          activeView === 'overview'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        @click="switchView('overview')"
      >
        概览
      </button>
      <button
        class="px-4 py-2 rounded-md transition-colors"
        :class="
          activeView === 'content'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        @click="switchView('content')"
      >
        内容分析
      </button>
      <button
        class="px-4 py-2 rounded-md transition-colors"
        :class="
          activeView === 'users'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        @click="switchView('users')"
      >
        用户分析
      </button>
      <button
        class="px-4 py-2 rounded-md transition-colors"
        :class="
          activeView === 'engagement'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        @click="switchView('engagement')"
      >
        参与度分析
      </button>
      <button
        class="px-4 py-2 rounded-md transition-colors"
        :class="
          activeView === 'revenue'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        @click="switchView('revenue')"
      >
        收入分析
      </button>
    </div>

    <!-- 概览视图 -->
    <div
      v-if="activeView === 'overview'"
      class="space-y-6"
    >
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">总文章数</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ formatNumber(overview.totalPosts || 0) }}
          </div>
          <div
            class="text-sm mt-2"
            :class="getGrowthColor(overview.growthRates?.posts || 0)"
          >
            {{ formatPercent(overview.growthRates?.posts || 0) }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">总评论数</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ formatNumber(overview.totalComments || 0) }}
          </div>
          <div
            class="text-sm mt-2"
            :class="getGrowthColor(overview.growthRates?.comments || 0)"
          >
            {{ formatPercent(overview.growthRates?.comments || 0) }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">注册用户</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ formatNumber(overview.totalUsers || 0) }}
          </div>
          <div
            class="text-sm mt-2"
            :class="getGrowthColor(overview.growthRates?.users || 0)"
          >
            {{ formatPercent(overview.growthRates?.users || 0) }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">总点赞数</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ formatNumber(overview.totalLikes || 0) }}
          </div>
          <div class="text-sm text-gray-500 mt-2">
            收藏: {{ formatNumber(overview.totalFavorites || 0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 内容分析视图 -->
    <div
      v-if="activeView === 'content'"
      class="space-y-6"
    >
      <!-- 文章状态分布 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">文章状态分布</h3>
          <div class="space-y-3">
            <div
              v-for="status in content.postsByStatus || []"
              :key="status.status"
              class="flex items-center justify-between"
            >
              <span class="text-gray-700">
                {{
                  status.status === 'PUBLISHED'
                    ? '已发布'
                    : status.status === 'DRAFT'
                      ? '草稿'
                      : status.status
                }}
              </span>
              <div class="flex items-center gap-2">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{
                      width: `${(status.count / Math.max(...(content.postsByStatus || []).map((s: any) => s.count), 1)) * 100}%`,
                    }"
                  />
                </div>
                <span class="text-sm font-medium text-gray-600">
                  {{ status.count }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">内容统计</h3>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-600">平均每篇文章评论数</span>
              <span class="font-medium">{{ content.averageCommentsPerPost || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章发布趋势 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">文章发布趋势</h3>
        <div class="h-64 flex items-end gap-1">
          <div
            v-for="day in content.postsByDay || []"
            :key="day.date"
            class="flex-1 flex flex-col items-center"
          >
            <div
              class="w-full bg-blue-500 rounded-t"
              :style="{
                height: `${getChartHeight(day.count, getMaxValue(content.postsByDay || [], 'count'))}px`,
              }"
            />
            <div class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
              {{ formatDate(day.date) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 热门文章 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">热门文章 Top 10</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  排名
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  标题
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  浏览量
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  点赞数
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  评论数
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  参与率
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(post, index) in content.topPosts || []"
                :key="post.id"
              >
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ index + 1 }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <NuxtLink
                    :to="`/posts/${post.slug}`"
                    class="text-blue-600 hover:underline"
                  >
                    {{ post.title }}
                  </NuxtLink>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ formatNumber(post.views) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ post.likes }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ post.comments }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ post.engagementRate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 用户分析视图 -->
    <div
      v-if="activeView === 'users'"
      class="space-y-6"
    >
      <!-- 用户统计 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">日活跃用户</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ users.activeUsers?.daily || 0 }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">周活跃用户</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ users.activeUsers?.weekly || 0 }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">月活跃用户</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ users.activeUsers?.monthly || 0 }}
          </div>
        </div>
      </div>

      <!-- 用户增长趋势 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">用户增长趋势</h3>
        <div class="h-64 flex items-end gap-1">
          <div
            v-for="day in users.userGrowth || []"
            :key="day.date"
            class="flex-1 flex flex-col items-center"
          >
            <div
              class="w-full bg-green-500 rounded-t"
              :style="{
                height: `${getChartHeight(day.newUsers, getMaxValue(users.userGrowth || [], 'newUsers'))}px`,
              }"
            />
            <div class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
              {{ formatDate(day.date) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 用户角色和状态分布 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">用户角色分布</h3>
          <div class="space-y-3">
            <div
              v-for="role in users.usersByRole || []"
              :key="role.role"
              class="flex items-center justify-between"
            >
              <span class="text-gray-700">
                {{
                  role.role === 'ADMIN' ? '管理员' : role.role === 'USER' ? '普通用户' : role.role
                }}
              </span>
              <div class="flex items-center gap-2">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-purple-500 h-2 rounded-full"
                    :style="{
                      width: `${(role.count / Math.max(...(users.usersByRole || []).map((r: any) => r.count), 1)) * 100}%`,
                    }"
                  />
                </div>
                <span class="text-sm font-medium text-gray-600">
                  {{ role.count }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">用户状态分布</h3>
          <div class="space-y-3">
            <div
              v-for="status in users.usersByStatus || []"
              :key="status.status"
              class="flex items-center justify-between"
            >
              <span class="text-gray-700">
                {{
                  status.status === 'ACTIVE'
                    ? '正常'
                    : status.status === 'INACTIVE'
                      ? '未激活'
                      : status.status === 'BANNED'
                        ? '封禁'
                        : status.status
                }}
              </span>
              <div class="flex items-center gap-2">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{
                      width: `${(status.count / Math.max(...(users.usersByStatus || []).map((s: any) => s.count), 1)) * 100}%`,
                    }"
                  />
                </div>
                <span class="text-sm font-medium text-gray-600">
                  {{ status.count }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 贡献者排行 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">贡献者排行 Top 10</h3>
        <div class="space-y-3">
          <div
            v-for="(user, index) in users.topContributors || []"
            :key="user.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded"
          >
            <div class="flex items-center gap-3">
              <span class="text-gray-400 w-6">
                {{ index + 1 }}
              </span>
              <img
                :src="user.avatar || '/default-avatar.svg'"
                class="w-8 h-8 rounded-full"
              />
              <span class="font-medium">
                {{ user.username }}
              </span>
            </div>
            <div class="flex gap-4 text-sm text-gray-500">
              <span>{{ user.postCount }} 篇文章</span>
              <span>{{ user.commentCount }} 条评论</span>
              <span class="font-medium text-gray-700"> {{ user.totalEngagement }} 总贡献 </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 参与度分析视图 -->
    <div
      v-if="activeView === 'engagement'"
      class="space-y-6"
    >
      <!-- 参与度统计 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">平均参与率</h3>
        <div class="text-4xl font-bold text-blue-600">
          {{ engagement.averageEngagementRate || 0 }}
        </div>
        <div class="text-sm text-gray-500 mt-2">每篇文章平均获得的互动数</div>
      </div>

      <!-- 参与度趋势 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">点赞趋势</h3>
          <div class="h-48 flex items-end gap-1">
            <div
              v-for="day in engagement.likesByDay || []"
              :key="day.date"
              class="flex-1 flex flex-col items-center"
            >
              <div
                class="w-full bg-red-500 rounded-t"
                :style="{
                  height: `${getChartHeight(day.count, getMaxValue(engagement.likesByDay || [], 'count'))}px`,
                }"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">评论趋势</h3>
          <div class="h-48 flex items-end gap-1">
            <div
              v-for="day in engagement.commentsByDay || []"
              :key="day.date"
              class="flex-1 flex flex-col items-center"
            >
              <div
                class="w-full bg-blue-500 rounded-t"
                :style="{
                  height: `${getChartHeight(day.count, getMaxValue(engagement.commentsByDay || [], 'count'))}px`,
                }"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">收藏趋势</h3>
          <div class="h-48 flex items-end gap-1">
            <div
              v-for="day in engagement.favoritesByDay || []"
              :key="day.date"
              class="flex-1 flex flex-col items-center"
            >
              <div
                class="w-full bg-yellow-500 rounded-t"
                :style="{
                  height: `${getChartHeight(day.count, getMaxValue(engagement.favoritesByDay || [], 'count'))}px`,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 热门参与文章 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">热门参与文章 Top 10</h3>
        <div class="space-y-3">
          <div
            v-for="(post, index) in engagement.topEngagingPosts || []"
            :key="post.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded"
          >
            <div class="flex items-center gap-3">
              <span class="text-gray-400 w-6">
                {{ index + 1 }}
              </span>
              <span class="font-medium">
                {{ post.title }}
              </span>
            </div>
            <span class="text-sm font-medium text-blue-600"> {{ post.engagementScore }} 分 </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 收入分析视图 -->
    <div
      v-if="activeView === 'revenue'"
      class="space-y-6"
    >
      <!-- 收入统计 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">广告展示</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ formatNumber(revenue.adImpressions || 0) }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">广告点击</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ formatNumber(revenue.adClicks || 0) }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">点击率 (CTR)</div>
          <div class="text-3xl font-bold text-gray-900">{{ revenue.adCTR || 0 }}%</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">预估收入</div>
          <div class="text-3xl font-bold text-green-600">
            ${{ (revenue.adRevenue || 0).toFixed(2) }}
          </div>
        </div>
      </div>

      <!-- 收入趋势 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">收入趋势</h3>
        <div class="h-64 flex items-end gap-1">
          <div
            v-for="day in revenue.revenueByDay || []"
            :key="day.date"
            class="flex-1 flex flex-col items-center"
          >
            <div
              class="w-full bg-green-500 rounded-t"
              :style="{
                height: `${getChartHeight(day.revenue, getMaxValue(revenue.revenueByDay || [], 'revenue'))}px`,
              }"
            />
            <div class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
              {{ formatDate(day.date) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 广告表现排行 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">广告表现排行</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  排名
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  广告名称
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  展示次数
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  点击次数
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  点击率
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(ad, index) in revenue.topPerformingAds || []"
                :key="ad.id"
              >
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ index + 1 }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ ad.name }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ formatNumber(ad.impressions) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ formatNumber(ad.clicks) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ ad.ctr }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
