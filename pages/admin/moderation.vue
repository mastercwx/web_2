<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const authStore = useAuthStore()

// 视图模式
const activeView = ref<'queue' | 'stats' | 'rules'>('queue')

// 队列筛选
const queueType = ref<'all' | 'comments' | 'reports'>('all')
const queueStatus = ref('PENDING')
const page = ref(1)
const pageSize = ref(20)

// 批量操作
const selectedItems = ref<Array<{ id: number; type: 'comment' | 'report' }>>([])
const bulkAction = ref('')

// 详情查看
const selectedItem = ref<any>(null)
const showDetail = ref(false)

// 获取审核队列
const {
  data: queueData,
  refresh: refreshQueue,
  pending,
} = await useFetch('/api/moderation/queue', {
  query: computed(() => ({
    type: queueType.value,
    status: queueStatus.value,
    page: page.value,
    pageSize: pageSize.value,
  })),
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const queueItems = computed(() => (queueData.value as any)?.data?.items || [])
const queueTotal = computed(() => (queueData.value as any)?.data?.total || 0)
const queueTotalPages = computed(() => (queueData.value as any)?.data?.totalPages || 0)

// 获取审核统计
const { data: statsData, refresh: refreshStats } = await useFetch('/api/moderation/stats', {
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const stats = computed(() => (statsData.value as any)?.data || {})

// 敏感度分析
const analyzeContent = ref('')
const analyzeResult = ref<any>(null)
const analyzing = ref(false)

// 切换视图
function switchView(view: 'queue' | 'stats' | 'rules') {
  activeView.value = view
  if (view === 'stats') {
    refreshStats()
  }
}

// 筛选处理
function handleFilterChange() {
  page.value = 1
  refreshQueue()
}

// 分页处理
function handlePageChange(newPage: number) {
  page.value = newPage
  refreshQueue()
}

// 选择项目
function toggleSelectItem(item: { id: number; type: 'comment' | 'report' }) {
  const index = selectedItems.value.findIndex((i) => i.id === item.id && i.type === item.type)
  if (index === -1) {
    selectedItems.value.push(item)
  } else {
    selectedItems.value.splice(index, 1)
  }
}

// 全选/取消全选
function toggleSelectAll() {
  if (selectedItems.value.length === queueItems.value.length) {
    selectedItems.value = []
  } else {
    selectedItems.value = queueItems.value.map((item: any) => ({
      id: item.id,
      type: item.type,
    }))
  }
}

// 批量操作
async function handleBulkAction() {
  if (!bulkAction.value || selectedItems.value.length === 0) {
    return
  }

  const actionLabel =
    bulkAction.value === 'approve' ? '批准' : bulkAction.value === 'reject' ? '拒绝' : '删除'

  const confirmed = confirm(`确定要${actionLabel} ${selectedItems.value.length} 个项目吗？`)
  if (!confirmed) return

  try {
    const result = await $fetch('/api/moderation/bulk', {
      method: 'POST',
      body: {
        items: selectedItems.value,
        action: bulkAction.value,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    const data = result as any
    alert(`操作完成：成功 ${data.data.success} 个，失败 ${data.data.failed} 个`)
    selectedItems.value = []
    bulkAction.value = ''
    refreshQueue()
  } catch (error: any) {
    alert(`操作失败：${error.message}`)
  }
}

// 单个审核操作
async function handleModerate(item: { id: number; type: 'comment' | 'report' }, action: string) {
  try {
    await $fetch('/api/moderation/bulk', {
      method: 'POST',
      body: {
        items: [item],
        action,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    refreshQueue()
  } catch (error: any) {
    alert(`操作失败：${error.message}`)
  }
}

// 查看详情
function viewDetail(item: any) {
  selectedItem.value = item
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedItem.value = null
}

function approveSelectedItem() {
  if (selectedItem.value) {
    handleModerate({ id: selectedItem.value.id, type: selectedItem.value.type }, 'approve')
    closeDetail()
  }
}

function rejectSelectedItem() {
  if (selectedItem.value) {
    handleModerate({ id: selectedItem.value.id, type: selectedItem.value.type }, 'reject')
    closeDetail()
  }
}

function deleteSelectedItem() {
  if (selectedItem.value) {
    handleModerate({ id: selectedItem.value.id, type: selectedItem.value.type }, 'delete')
    closeDetail()
  }
}

// 敏感度分析
async function handleAnalyze() {
  if (!analyzeContent.value.trim()) return

  analyzing.value = true
  try {
    const result = await $fetch('/api/moderation/analyze', {
      method: 'POST',
      body: { content: analyzeContent.value },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    analyzeResult.value = (result as any).data
  } catch (error: any) {
    alert(`分析失败：${error.message}`)
  } finally {
    analyzing.value = false
  }
}

// 获取敏感度颜色
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-red-600 bg-red-100'
  if (score >= 40) return 'text-orange-600 bg-orange-100'
  if (score >= 20) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
}

// 获取敏感度等级
function getScoreLevel(score: number): string {
  if (score >= 70) return '高风险'
  if (score >= 40) return '中风险'
  if (score >= 20) return '低风险'
  return '安全'
}

// 获取类型标签
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    comment: '评论',
    post: '文章',
    report: '举报',
  }
  return labels[type] || type
}

// 获取类型颜色
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    comment: 'bg-blue-100 text-blue-800',
    post: 'bg-purple-100 text-purple-800',
    report: 'bg-red-100 text-red-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

// 格式化时间
function formatTime(date: string): string {
  return new Date(date).toLocaleString()
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// 举报原因映射
const reasonMap: Record<string, string> = {
  spam: '垃圾内容/广告',
  abuse: '辱骂/骚扰',
  inappropriate: '不当内容',
  copyright: '版权侵犯',
  other: '其他原因',
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">内容审核中心</h1>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            activeView === 'queue'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click="switchView('queue')"
        >
          审核队列
        </button>
        <button
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            activeView === 'stats'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click="switchView('stats')"
        >
          统计分析
        </button>
        <button
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            activeView === 'rules'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click="switchView('rules')"
        >
          内容分析
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div
      v-if="activeView === 'stats'"
      class="space-y-6"
    >
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">待审核评论</div>
          <div class="text-3xl font-bold text-orange-600">
            {{ stats.pendingComments || 0 }}
          </div>
          <div class="text-sm text-gray-500 mt-2">
            总评论: {{ formatNumber(stats.totalComments || 0) }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">待处理举报</div>
          <div class="text-3xl font-bold text-red-600">
            {{ stats.pendingReports || 0 }}
          </div>
          <div class="text-sm text-gray-500 mt-2">
            总举报: {{ formatNumber(stats.totalReports || 0) }}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">平均响应时间</div>
          <div class="text-3xl font-bold text-blue-600">{{ stats.averageResponseTime || 0 }}h</div>
          <div class="text-sm text-gray-500 mt-2">近30天平均</div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-sm text-gray-500">已处理举报</div>
          <div class="text-3xl font-bold text-green-600">
            {{ (stats.resolvedReports || 0) + (stats.dismissedReports || 0) }}
          </div>
          <div class="text-sm text-gray-500 mt-2">
            解决率:
            {{
              stats.totalReports
                ? Math.round(
                    (((stats.resolvedReports || 0) + (stats.dismissedReports || 0)) /
                      stats.totalReports) *
                      100,
                  )
                : 0
            }}%
          </div>
        </div>
      </div>

      <!-- 审核活动趋势 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">近30天审核活动</h3>
        <div class="h-64 flex items-end gap-1">
          <div
            v-for="day in stats.moderationActivity || []"
            :key="day.date"
            class="flex-1 flex flex-col items-center"
          >
            <div
              class="w-full bg-blue-500 rounded-t"
              :style="{
                height: `${Math.max(4, (day.count / Math.max(...(stats.moderationActivity || []).map((d: any) => d.count), 1)) * 200)}px`,
              }"
            />
            <div class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
              {{ day.date.slice(5) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 热门举报原因 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">热门举报原因</h3>
          <div class="space-y-3">
            <div
              v-for="reason in stats.topReportReasons || []"
              :key="reason.reason"
              class="flex items-center justify-between"
            >
              <span class="text-gray-700">
                {{ reasonMap[reason.reason] || reason.reason }}
              </span>
              <div class="flex items-center gap-2">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-red-500 h-2 rounded-full"
                    :style="{
                      width: `${(reason.count / Math.max(...(stats.topReportReasons || []).map((r: any) => r.count), 1)) * 100}%`,
                    }"
                  />
                </div>
                <span class="text-sm font-medium text-gray-600">
                  {{ reason.count }}
                </span>
              </div>
            </div>
            <div
              v-if="(stats.topReportReasons || []).length === 0"
              class="text-gray-500 text-center py-4"
            >
              暂无数据
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">审核效率</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">评论审核率</span>
                <span class="font-medium">
                  {{
                    stats.totalComments
                      ? Math.round(
                          (((stats.approvedComments || 0) + (stats.rejectedComments || 0)) /
                            stats.totalComments) *
                            100,
                        )
                      : 0
                  }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full"
                  :style="{
                    width: `${stats.totalComments ? Math.round((((stats.approvedComments || 0) + (stats.rejectedComments || 0)) / stats.totalComments) * 100) : 0}%`,
                  }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">举报处理率</span>
                <span class="font-medium">
                  {{
                    stats.totalReports
                      ? Math.round(
                          (((stats.resolvedReports || 0) + (stats.dismissedReports || 0)) /
                            stats.totalReports) *
                            100,
                        )
                      : 0
                  }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-green-500 h-2 rounded-full"
                  :style="{
                    width: `${stats.totalReports ? Math.round((((stats.resolvedReports || 0) + (stats.dismissedReports || 0)) / stats.totalReports) * 100) : 0}%`,
                  }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">批准率</span>
                <span class="font-medium">
                  {{
                    (stats.approvedComments || 0) + (stats.rejectedComments || 0)
                      ? Math.round(
                          ((stats.approvedComments || 0) /
                            ((stats.approvedComments || 0) + (stats.rejectedComments || 0))) *
                            100,
                        )
                      : 0
                  }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-purple-500 h-2 rounded-full"
                  :style="{
                    width: `${(stats.approvedComments || 0) + (stats.rejectedComments || 0) ? Math.round(((stats.approvedComments || 0) / ((stats.approvedComments || 0) + (stats.rejectedComments || 0))) * 100) : 0}%`,
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容分析工具 -->
    <div
      v-if="activeView === 'rules'"
      class="space-y-6"
    >
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">内容敏感度分析</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> 输入要分析的内容 </label>
            <textarea
              v-model="analyzeContent"
              rows="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入文本内容进行敏感度分析..."
            />
          </div>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="analyzing || !analyzeContent.trim()"
            @click="handleAnalyze"
          >
            {{ analyzing ? '分析中...' : '开始分析' }}
          </button>
        </div>

        <div
          v-if="analyzeResult"
          class="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <h4 class="font-semibold mb-3">分析结果</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500">敏感度分数</div>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="text-2xl font-bold px-3 py-1 rounded"
                  :class="getScoreColor(analyzeResult.score)"
                >
                  {{ analyzeResult.score }}
                </span>
                <span
                  class="px-2 py-1 rounded text-sm"
                  :class="getScoreColor(analyzeResult.score)"
                >
                  {{ getScoreLevel(analyzeResult.score) }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">触发标记</div>
              <div class="mt-1 space-y-1">
                <div
                  v-for="(flag, index) in analyzeResult.flags"
                  :key="index"
                  class="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded"
                >
                  {{ flag }}
                </div>
                <div
                  v-if="analyzeResult.flags.length === 0"
                  class="text-sm text-green-600"
                >
                  未发现敏感标记
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审核规则说明 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">自动审核规则</h3>
        <div class="space-y-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-800 mb-2">关键词检测</h4>
            <p class="text-sm text-blue-600">
              自动检测包含敏感词的内容，如：spam、广告、代购、赌博等
            </p>
          </div>
          <div class="p-4 bg-yellow-50 rounded-lg">
            <h4 class="font-medium text-yellow-800 mb-2">链接检测</h4>
            <p class="text-sm text-yellow-600">检测包含过多链接的内容，防止垃圾链接 spam</p>
          </div>
          <div class="p-4 bg-purple-50 rounded-lg">
            <h4 class="font-medium text-purple-800 mb-2">内容长度检测</h4>
            <p class="text-sm text-purple-600">检测过短或过长的异常内容</p>
          </div>
          <div class="p-4 bg-red-50 rounded-lg">
            <h4 class="font-medium text-red-800 mb-2">重复字符检测</h4>
            <p class="text-sm text-red-600">检测包含大量重复字符的垃圾内容</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 审核队列 -->
    <div
      v-if="activeView === 'queue'"
      class="space-y-4"
    >
      <!-- 筛选工具栏 -->
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex flex-wrap items-center gap-4">
          <!-- 类型筛选 -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">内容类型</label>
            <select
              v-model="queueType"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm"
              @change="handleFilterChange"
            >
              <option value="all">全部类型</option>
              <option value="comments">评论</option>
              <option value="reports">举报</option>
            </select>
          </div>

          <!-- 状态筛选 -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">状态</label>
            <select
              v-model="queueStatus"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm"
              @change="handleFilterChange"
            >
              <option value="PENDING">待处理</option>
              <option value="APPROVED">已批准</option>
              <option value="REJECTED">已拒绝</option>
              <option value="ALL">全部状态</option>
            </select>
          </div>

          <!-- 批量操作 -->
          <div class="ml-auto flex items-center gap-2">
            <span
              v-if="selectedItems.length > 0"
              class="text-sm text-gray-600"
            >
              已选择 {{ selectedItems.length }} 项
            </span>
            <select
              v-if="selectedItems.length > 0"
              v-model="bulkAction"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">选择操作</option>
              <option value="approve">批量批准</option>
              <option value="reject">批量拒绝</option>
              <option value="delete">批量删除</option>
            </select>
            <button
              v-if="selectedItems.length > 0"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              :disabled="!bulkAction"
              @click="handleBulkAction"
            >
              执行
            </button>
            <button
              v-if="selectedItems.length > 0"
              class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              @click="selectedItems = []"
            >
              取消选择
            </button>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="flex gap-4 text-sm text-gray-600">
        <span>共 {{ queueTotal }} 条记录</span>
        <span>第 {{ page }} / {{ queueTotalPages }} 页</span>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="pending"
        class="text-center py-8"
      >
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"
        />
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="queueItems.length === 0"
        class="text-center py-12 bg-white rounded-lg shadow-md"
      >
        <div class="text-gray-400 text-5xl mb-4">✓</div>
        <p class="text-gray-500">暂无待审核内容</p>
      </div>

      <!-- 审核队列列表 -->
      <div
        v-else
        class="space-y-3"
      >
        <!-- 全选 -->
        <div class="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            :checked="selectedItems.length === queueItems.length && queueItems.length > 0"
            class="rounded"
            @change="toggleSelectAll"
          />
          <span class="text-sm text-gray-600">全选</span>
        </div>

        <div
          v-for="item in queueItems"
          :key="`${item.type}-${item.id}`"
          class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
        >
          <div class="flex items-start gap-4">
            <!-- 选择框 -->
            <input
              type="checkbox"
              :checked="selectedItems.some((i) => i.id === item.id && i.type === item.type)"
              class="mt-1 rounded"
              @change="toggleSelectItem({ id: item.id, type: item.type })"
            />

            <!-- 内容区域 -->
            <div class="flex-1 min-w-0">
              <!-- 头部信息 -->
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getTypeColor(item.type)"
                >
                  {{ getTypeLabel(item.type) }}
                </span>
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getScoreColor(item.sensitivityScore)"
                >
                  {{ getScoreLevel(item.sensitivityScore) }} ({{ item.sensitivityScore }})
                </span>
                <span class="text-sm text-gray-500">
                  {{ formatTime(item.createdAt) }}
                </span>
              </div>

              <!-- 作者信息 -->
              <div class="flex items-center gap-2 mb-2">
                <img
                  :src="item.author.avatar || '/default-avatar.png'"
                  class="w-6 h-6 rounded-full"
                />
                <span class="text-sm font-medium text-gray-700">
                  {{ item.author.username }}
                </span>
                <span
                  v-if="item.metadata?.postTitle"
                  class="text-sm text-gray-500"
                >
                  在《{{ item.metadata.postTitle }}》中
                </span>
              </div>

              <!-- 内容预览 -->
              <div class="text-gray-800 mb-3 line-clamp-3">
                {{ item.content }}
              </div>

              <!-- 标记 -->
              <div
                v-if="item.flags.length > 0"
                class="flex flex-wrap gap-1 mb-3"
              >
                <span
                  v-for="(flag, index) in item.flags"
                  :key="index"
                  class="px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs"
                >
                  {{ flag }}
                </span>
              </div>

              <!-- 举报信息 -->
              <div
                v-if="item.type === 'report' && item.metadata?.reason"
                class="text-sm text-red-600 mb-2"
              >
                举报原因: {{ reasonMap[item.metadata.reason] || item.metadata.reason }}
              </div>

              <!-- 操作按钮 -->
              <div class="flex gap-2">
                <button
                  class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  @click="handleModerate({ id: item.id, type: item.type }, 'approve')"
                >
                  批准
                </button>
                <button
                  class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                  @click="handleModerate({ id: item.id, type: item.type }, 'reject')"
                >
                  拒绝
                </button>
                <button
                  class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  @click="handleModerate({ id: item.id, type: item.type }, 'delete')"
                >
                  删除
                </button>
                <button
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  @click="viewDetail(item)"
                >
                  详情
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="queueTotalPages > 1"
        class="flex justify-between items-center"
      >
        <div class="text-sm text-gray-500">共 {{ queueTotal }} 条记录</div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 rounded-md border"
            :disabled="page <= 1"
            @click="handlePageChange(page - 1)"
          >
            上一页
          </button>
          <template
            v-for="p in queueTotalPages"
            :key="p"
          >
            <button
              v-if="p === 1 || p === queueTotalPages || (p >= page - 2 && p <= page + 2)"
              class="px-3 py-1 rounded-md border"
              :class="p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'"
              @click="handlePageChange(p)"
            >
              {{ p }}
            </button>
            <span
              v-else-if="p === page - 3 || p === page + 3"
              class="px-2 py-1"
            >
              ...
            </span>
          </template>
          <button
            class="px-3 py-1 rounded-md border"
            :disabled="page >= queueTotalPages"
            @click="handlePageChange(page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetail"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold">内容详情</h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="closeDetail"
            >
              ✕
            </button>
          </div>

          <div
            v-if="selectedItem"
            class="space-y-4"
          >
            <!-- 基本信息 -->
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="getTypeColor(selectedItem.type)"
              >
                {{ getTypeLabel(selectedItem.type) }}
              </span>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="getScoreColor(selectedItem.sensitivityScore)"
              >
                敏感度: {{ selectedItem.sensitivityScore }}
              </span>
            </div>

            <!-- 作者信息 -->
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <img
                :src="selectedItem.author.avatar || '/default-avatar.png'"
                class="w-10 h-10 rounded-full"
              />
              <div>
                <div class="font-medium">
                  {{ selectedItem.author.username }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ formatTime(selectedItem.createdAt) }}
                </div>
              </div>
            </div>

            <!-- 内容 -->
            <div class="p-4 bg-gray-50 rounded">
              <div class="text-sm text-gray-500 mb-2">内容</div>
              <div class="whitespace-pre-wrap">
                {{ selectedItem.content }}
              </div>
            </div>

            <!-- 标记详情 -->
            <div
              v-if="selectedItem.flags.length > 0"
              class="p-4 bg-orange-50 rounded"
            >
              <div class="text-sm font-medium text-orange-800 mb-2">触发标记</div>
              <div class="space-y-1">
                <div
                  v-for="(flag, index) in selectedItem.flags"
                  :key="index"
                  class="text-sm text-orange-600"
                >
                  • {{ flag }}
                </div>
              </div>
            </div>

            <!-- 元数据 -->
            <div
              v-if="selectedItem.metadata"
              class="p-4 bg-gray-50 rounded"
            >
              <div class="text-sm font-medium text-gray-700 mb-2">附加信息</div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div
                  v-for="(value, key) in selectedItem.metadata"
                  :key="key"
                >
                  <span class="text-gray-500">{{ key }}:</span>
                  <span class="ml-1 text-gray-700">{{ value }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2 pt-4 border-t">
              <button
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                @click="approveSelectedItem"
              >
                批准
              </button>
              <button
                class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                @click="rejectSelectedItem"
              >
                拒绝
              </button>
              <button
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                @click="deleteSelectedItem"
              >
                删除
              </button>
              <button
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 ml-auto"
                @click="closeDetail"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
