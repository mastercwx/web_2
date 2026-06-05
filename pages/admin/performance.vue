<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  duration: number
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  timestamp: string
  checks: HealthCheck[]
}

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: string
  category: string
}

interface EndpointPerformance {
  path: string
  method: string
  requests: number
  avgResponseTime: number
  p95ResponseTime: number
  errorRate: number
  lastAccessed: string
}

interface ResourceUsage {
  cpu: {
    current: number
    average: number
    peak: number
  }
  memory: {
    current: number
    total: number
    percentage: number
  }
  disk: {
    current: number
    total: number
    percentage: number
  }
}

interface PerformanceAlert {
  id: string
  metric: string
  condition: string
  threshold: number
  severity: 'warning' | 'critical'
  enabled: boolean
  message: string
}

const activeTab = ref('health')
const loading = ref(false)
const autoRefresh = ref(false)
const refreshInterval = ref<NodeJS.Timeout | null>(null)

const health = ref<SystemHealth | null>(null)
const metrics = ref<PerformanceMetric[]>([])
const endpoints = ref<EndpointPerformance[]>([])
const resources = ref<ResourceUsage | null>(null)
const alerts = ref<PerformanceAlert[]>([])
const period = ref<'1h' | '24h' | '7d' | '30d'>('24h')

const statusColors: Record<string, string> = {
  healthy: 'text-green-600 dark:text-green-400',
  degraded: 'text-yellow-600 dark:text-yellow-400',
  unhealthy: 'text-red-600 dark:text-red-400',
}

const statusIcons: Record<string, string> = {
  healthy: '✅',
  degraded: '⚠️',
  unhealthy: '❌',
}

const checkStatusColors: Record<string, string> = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const severityColors: Record<string, string> = {
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

async function fetchHealth() {
  try {
    health.value = await $fetch('/api/admin/performance/health')
  } catch (error) {
    console.error('Failed to fetch health:', error)
  }
}

async function fetchMetrics() {
  try {
    metrics.value = await $fetch('/api/admin/performance/metrics')
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
  }
}

async function fetchEndpoints() {
  try {
    endpoints.value = await $fetch('/api/admin/performance/report', {
      params: { period: period.value },
    }).then((r: any) => r.endpoints || [])
  } catch (error) {
    console.error('Failed to fetch endpoints:', error)
  }
}

async function fetchResources() {
  try {
    resources.value = await $fetch('/api/admin/performance/resources')
  } catch (error) {
    console.error('Failed to fetch resources:', error)
  }
}

async function fetchAlerts() {
  try {
    alerts.value = await $fetch('/api/admin/performance/alerts')
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  }
}

async function fetchAll() {
  loading.value = true
  try {
    await Promise.all([
      fetchHealth(),
      fetchMetrics(),
      fetchEndpoints(),
      fetchResources(),
      fetchAlerts(),
    ])
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value

  if (autoRefresh.value) {
    refreshInterval.value = setInterval(fetchAll, 5000)
  } else if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function _getMetricValue(id: string): number {
  const metric = metrics.value.find((m) => m.id === id)
  return metric?.value || 0
}

function _getMetricUnit(id: string): string {
  const metric = metrics.value.find((m) => m.id === id)
  return metric?.unit || ''
}

function getProgressColor(percentage: number): string {
  if (percentage > 90) return 'bg-red-500'
  if (percentage > 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

watch(period, () => {
  fetchEndpoints()
})

onMounted(() => {
  fetchAll()
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">📊 性能监控</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">实时监控系统性能和资源使用情况</p>
        </div>
        <div class="flex items-center gap-4">
          <button
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              autoRefresh
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
            ]"
            @click="toggleAutoRefresh"
          >
            {{ autoRefresh ? '⏸️ 停止刷新' : '▶️ 自动刷新' }}
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            @click="fetchAll"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6">
        <button
          :class="[
            'px-4 py-2 rounded-lg transition-colors',
            activeTab === 'health'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="activeTab = 'health'"
        >
          🏥 健康状态
        </button>
        <button
          :class="[
            'px-4 py-2 rounded-lg transition-colors',
            activeTab === 'metrics'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="activeTab = 'metrics'"
        >
          📈 实时指标
        </button>
        <button
          :class="[
            'px-4 py-2 rounded-lg transition-colors',
            activeTab === 'endpoints'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="activeTab = 'endpoints'"
        >
          🔗 API 性能
        </button>
        <button
          :class="[
            'px-4 py-2 rounded-lg transition-colors',
            activeTab === 'resources'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="activeTab = 'resources'"
        >
          💾 资源使用
        </button>
        <button
          :class="[
            'px-4 py-2 rounded-lg transition-colors',
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="activeTab = 'alerts'"
        >
          🔔 告警配置
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-12"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>

      <!-- 健康状态 -->
      <div
        v-else-if="activeTab === 'health' && health"
        class="space-y-6"
      >
        <!-- 整体状态 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">系统状态</h2>
            <span :class="['text-2xl font-bold', statusColors[health.status]]">
              {{ statusIcons[health.status] }} {{ health.status.toUpperCase() }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">运行时间</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatUptime(health.uptime) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">最后检查</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ new Date(health.timestamp).toLocaleTimeString() }}
              </p>
            </div>
          </div>
        </div>

        <!-- 健康检查 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">健康检查</h2>
          <div class="space-y-4">
            <div
              v-for="check in health.checks"
              :key="check.name"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-semibold',
                    checkStatusColors[check.status],
                  ]"
                >
                  {{ check.status.toUpperCase() }}
                </span>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ check.name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ check.message }}
                  </p>
                </div>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ check.duration > 0 ? formatDuration(check.duration) : '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 实时指标 -->
      <div
        v-else-if="activeTab === 'metrics'"
        class="space-y-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="metric in metrics"
            :key="metric.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ metric.name }}
              </h3>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ metric.category }}
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">
                {{
                  metric.unit === 'bytes'
                    ? formatBytes(metric.value)
                    : metric.value.toFixed(metric.unit === '%' ? 1 : 0)
                }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ metric.unit === 'bytes' ? '' : metric.unit }}
              </span>
            </div>
            <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
              更新于 {{ new Date(metric.timestamp).toLocaleTimeString() }}
            </p>
          </div>
        </div>
      </div>

      <!-- API 性能 -->
      <div
        v-else-if="activeTab === 'endpoints'"
        class="space-y-6"
      >
        <!-- 时间范围选择 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-gray-400"> 时间范围： </span>
            <button
              v-for="p in ['1h', '24h', '7d', '30d']"
              :key="p"
              :class="[
                'px-3 py-1 rounded text-sm',
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
              ]"
              @click="period = p as any"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- 端点列表 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  端点
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  请求数
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  平均响应时间
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  P95 响应时间
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  错误率
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="endpoint in endpoints"
                :key="`${endpoint.method}-${endpoint.path}`"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'px-2 py-1 rounded text-xs font-semibold',
                        methodColors[endpoint.method],
                      ]"
                    >
                      {{ endpoint.method }}
                    </span>
                    <code class="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {{ endpoint.path }}
                    </code>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ endpoint.requests.toLocaleString() }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <span
                    :class="[
                      endpoint.avgResponseTime > 500
                        ? 'text-red-600'
                        : endpoint.avgResponseTime > 200
                          ? 'text-yellow-600'
                          : 'text-green-600',
                    ]"
                  >
                    {{ formatDuration(endpoint.avgResponseTime) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ formatDuration(endpoint.p95ResponseTime) }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    :class="[
                      endpoint.errorRate > 5
                        ? 'text-red-600'
                        : endpoint.errorRate > 1
                          ? 'text-yellow-600'
                          : 'text-green-600',
                    ]"
                  >
                    {{ endpoint.errorRate.toFixed(2) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 资源使用 -->
      <div
        v-else-if="activeTab === 'resources' && resources"
        class="space-y-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- CPU -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🖥️ CPU 使用率</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-500 dark:text-gray-400">当前</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ resources.cpu.current.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    :class="['h-2 rounded-full', getProgressColor(resources.cpu.current)]"
                    :style="{ width: `${resources.cpu.current}%` }"
                  />
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-500 dark:text-gray-400">平均</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ resources.cpu.average.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    :class="['h-2 rounded-full', getProgressColor(resources.cpu.average)]"
                    :style="{ width: `${resources.cpu.average}%` }"
                  />
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-500 dark:text-gray-400">峰值</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ resources.cpu.peak.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    :class="['h-2 rounded-full', getProgressColor(resources.cpu.peak)]"
                    :style="{ width: `${resources.cpu.peak}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 内存 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">💾 内存使用</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-500 dark:text-gray-400">使用率</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ resources.memory.percentage.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    :class="['h-2 rounded-full', getProgressColor(resources.memory.percentage)]"
                    :style="{ width: `${resources.memory.percentage}%` }"
                  />
                </div>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatBytes(resources.memory.current) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  / {{ formatBytes(resources.memory.total) }}
                </p>
              </div>
            </div>
          </div>

          <!-- 磁盘 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">💿 磁盘使用</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-500 dark:text-gray-400">使用率</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ resources.disk.percentage.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    :class="['h-2 rounded-full', getProgressColor(resources.disk.percentage)]"
                    :style="{ width: `${resources.disk.percentage}%` }"
                  />
                </div>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatBytes(resources.disk.current) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  / {{ formatBytes(resources.disk.total) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 告警配置 -->
      <div
        v-else-if="activeTab === 'alerts'"
        class="space-y-6"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">告警规则</h2>
          <div class="space-y-4">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-semibold',
                    severityColors[alert.severity],
                  ]"
                >
                  {{ alert.severity === 'critical' ? '严重' : '警告' }}
                </span>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ alert.message }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ alert.metric }}
                    {{
                      alert.condition === 'above' ? '>' : alert.condition === 'below' ? '<' : '='
                    }}
                    {{ alert.threshold
                    }}{{
                      alert.metric.includes('rate') || alert.metric.includes('usage') ? '%' : 'ms'
                    }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs',
                    alert.enabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                  ]"
                >
                  {{ alert.enabled ? '已启用' : '已禁用' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
