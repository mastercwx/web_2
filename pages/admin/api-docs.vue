<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  summary: string
  description: string
  tags: string[]
  parameters?: Array<{
    name: string
    in: string
    required: boolean
    type: string
    description: string
    example?: string | number | boolean
  }>
  requestBody?: {
    contentType: string
    schema: Record<string, unknown>
    example: Record<string, unknown>
  }
  responses: Array<{
    status: number
    description: string
    example?: Record<string, unknown>
  }>
  authentication: boolean
  rateLimit?: string
}

interface ApiTag {
  name: string
  description: string
  endpoints: ApiEndpoint[]
}

const tags = ref<ApiTag[]>([])
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref<ApiEndpoint[]>([])
const selectedTag = ref<string | null>(null)
const selectedEndpoint = ref<ApiEndpoint | null>(null)
const showExamples = ref(false)
const curlExample = ref('')
const fetchExample = ref('')

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

const statusColors: Record<string, string> = {
  2: 'text-green-600 dark:text-green-400',
  3: 'text-blue-600 dark:text-blue-400',
  4: 'text-orange-600 dark:text-orange-400',
  5: 'text-red-600 dark:text-red-400',
}

async function fetchEndpoints() {
  loading.value = true
  try {
    const response = await $fetch('/api/docs/endpoints')
    tags.value = response.tags
  } catch (error) {
    console.error('Failed to fetch endpoints:', error)
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  try {
    const response = await $fetch('/api/docs/endpoints', {
      params: { search: searchQuery.value },
    })
    searchResults.value = response.endpoints
  } catch (error) {
    console.error('Failed to search endpoints:', error)
  }
}

function selectEndpoint(endpoint: ApiEndpoint) {
  selectedEndpoint.value = endpoint
  showExamples.value = false
}

async function loadExamples() {
  if (!selectedEndpoint.value) return

  showExamples.value = true
  try {
    const response = await $fetch('/api/docs/examples', {
      params: {
        path: selectedEndpoint.value.path,
        method: selectedEndpoint.value.method,
      },
    })
    curlExample.value = response.curl
    fetchExample.value = response.fetch
  } catch (error) {
    console.error('Failed to load examples:', error)
  }
}

function getStatusColor(status: number): string {
  return statusColors[status.toString()[0]] || 'text-gray-600'
}

const filteredTags = computed(() => {
  if (!selectedTag.value) return tags.value
  return tags.value.filter((tag) => tag.name === selectedTag.value)
})

const allTags = computed(() => {
  return tags.value.map((tag) => ({
    name: tag.name,
    count: tag.endpoints.length,
  }))
})

watch(searchQuery, () => {
  handleSearch()
})

onMounted(() => {
  fetchEndpoints()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">📚 API 文档</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Self HG 博客系统 API 接口文档</p>
      </div>

      <div class="flex gap-6">
        <!-- 左侧边栏 -->
        <div class="w-64 flex-shrink-0">
          <!-- 搜索框 -->
          <div class="mb-6">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索 API..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>

          <!-- 标签列表 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-3">API 分类</h3>
            <ul class="space-y-2">
              <li>
                <button
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    selectedTag === null
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                  ]"
                  @click="selectedTag = null"
                >
                  全部
                  <span class="float-right text-sm text-gray-500">
                    {{ tags.reduce((sum, tag) => sum + tag.endpoints.length, 0) }}
                  </span>
                </button>
              </li>
              <li
                v-for="tag in allTags"
                :key="tag.name"
              >
                <button
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    selectedTag === tag.name
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                  ]"
                  @click="selectedTag = tag.name"
                >
                  {{ tag.name }}
                  <span class="float-right text-sm text-gray-500">
                    {{ tag.count }}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="flex-1">
          <!-- 搜索结果 -->
          <div
            v-if="searchQuery && searchResults.length > 0"
            class="mb-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              搜索结果 ({{ searchResults.length }})
            </h2>
            <div class="space-y-3">
              <div
                v-for="endpoint in searchResults"
                :key="`${endpoint.method}-${endpoint.path}`"
                class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                @click="selectEndpoint(endpoint)"
              >
                <div class="flex items-center gap-3">
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
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {{ endpoint.summary }}
                </p>
              </div>
            </div>
          </div>

          <!-- API 分组列表 -->
          <div v-else>
            <div
              v-for="tag in filteredTags"
              :key="tag.name"
              class="mb-8"
            >
              <div class="mb-4">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ tag.name }}
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ tag.description }}
                </p>
              </div>

              <div class="space-y-3">
                <div
                  v-for="endpoint in tag.endpoints"
                  :key="`${endpoint.method}-${endpoint.path}`"
                  :class="[
                    'bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow border-2',
                    selectedEndpoint?.path === endpoint.path &&
                    selectedEndpoint?.method === endpoint.method
                      ? 'border-blue-500'
                      : 'border-transparent',
                  ]"
                  @click="selectEndpoint(endpoint)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
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
                    <div class="flex items-center gap-2">
                      <span
                        v-if="endpoint.authentication"
                        class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded"
                      >
                        🔒 需要认证
                      </span>
                      <span
                        v-if="endpoint.rateLimit"
                        class="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded"
                      >
                        ⏱️ {{ endpoint.rateLimit }}
                      </span>
                    </div>
                  </div>
                  <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {{ endpoint.summary }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div
          v-if="selectedEndpoint"
          class="w-96 flex-shrink-0"
        >
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'px-3 py-1 rounded font-semibold',
                    methodColors[selectedEndpoint.method],
                  ]"
                >
                  {{ selectedEndpoint.method }}
                </span>
                <code class="text-sm font-mono">
                  {{ selectedEndpoint.path }}
                </code>
              </div>
              <button
                class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                @click="selectedEndpoint = null"
              >
                ✕
              </button>
            </div>

            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ selectedEndpoint.summary }}
            </h3>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ selectedEndpoint.description }}
            </p>

            <!-- 认证信息 -->
            <div
              v-if="selectedEndpoint.authentication"
              class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
            >
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                🔒 此接口需要 JWT Token 认证
              </p>
            </div>

            <!-- 速率限制 -->
            <div
              v-if="selectedEndpoint.rateLimit"
              class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <p class="text-sm text-gray-600 dark:text-gray-300">
                ⏱️ 速率限制: {{ selectedEndpoint.rateLimit }}
              </p>
            </div>

            <!-- 参数 -->
            <div
              v-if="selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0"
              class="mb-4"
            >
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">请求参数</h4>
              <div class="space-y-2">
                <div
                  v-for="param in selectedEndpoint.parameters"
                  :key="param.name"
                  class="p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div class="flex items-center gap-2">
                    <code class="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {{ param.name }}
                    </code>
                    <span class="text-xs text-gray-500">
                      {{ param.in }}
                    </span>
                    <span
                      v-if="param.required"
                      class="text-xs text-red-500"
                    >
                      必填
                    </span>
                    <span class="text-xs text-gray-400">
                      {{ param.type }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {{ param.description }}
                  </p>
                  <p
                    v-if="param.example"
                    class="text-xs text-gray-500 mt-1"
                  >
                    示例: {{ param.example }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 请求体 -->
            <div
              v-if="selectedEndpoint.requestBody"
              class="mb-4"
            >
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">请求体</h4>
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p class="text-xs text-gray-500 mb-2">
                  Content-Type: {{ selectedEndpoint.requestBody.contentType }}
                </p>
                <pre
                  class="text-xs overflow-x-auto"
                ><code>{{ JSON.stringify(selectedEndpoint.requestBody.example, null, 2) }}</code></pre>
              </div>
            </div>

            <!-- 响应 -->
            <div class="mb-4">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">响应</h4>
              <div class="space-y-2">
                <div
                  v-for="response in selectedEndpoint.responses"
                  :key="response.status"
                  class="p-3 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="['font-mono font-semibold', getStatusColor(response.status)]">
                      {{ response.status }}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ response.description }}
                    </span>
                  </div>
                  <pre
                    v-if="response.example"
                    class="text-xs overflow-x-auto mt-2"
                  ><code>{{ JSON.stringify(response.example, null, 2) }}</code></pre>
                </div>
              </div>
            </div>

            <!-- 示例代码按钮 -->
            <button
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              @click="loadExamples"
            >
              {{ showExamples ? '刷新示例' : '查看示例代码' }}
            </button>

            <!-- 示例代码 -->
            <div
              v-if="showExamples"
              class="mt-4"
            >
              <div class="mb-4">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">cURL</h4>
                <pre
                  class="p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto"
                ><code>{{ curlExample }}</code></pre>
              </div>

              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">JavaScript Fetch</h4>
                <pre
                  class="p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto"
                ><code>{{ fetchExample }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-12"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  </div>
</template>
