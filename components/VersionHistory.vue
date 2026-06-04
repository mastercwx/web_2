<script setup lang="ts">
interface Version {
  id: number
  version: number
  title: string
  comment: string | null
  createdAt: string
  author: {
    id: number
    username: string
    avatar: string | null
  }
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  line: string
  lineNum1?: number
  lineNum2?: number
}

const props = defineProps<{
  postId: number
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  restore: [content: { title: string; content: string }]
}>()

const authStore = useAuthStore()
const versions = ref<Version[]>([])
const loading = ref(false)
const error = ref('')
const selectedVersion = ref<Version | null>(null)
const comparing = ref(false)
const diffResult = ref<{
  version1: any
  version2: any
  titleChanged: boolean
  contentChanged: boolean
  contentDiff: DiffLine[]
} | null>(null)
const compareVersionId = ref<number | null>(null)

// 加载版本历史
async function loadVersions() {
  loading.value = true
  error.value = ''

  try {
    const { data, error: fetchError } = await useFetch(`/api/posts/${props.postId}/versions`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (fetchError.value) {
      throw new Error(fetchError.value.message || '加载失败')
    }

    const result = data.value as any
    if (result?.code === 200) {
      versions.value = result.data.versions
    }
  } catch (e: any) {
    error.value = e.message || '加载版本历史失败'
  } finally {
    loading.value = false
  }
}

// 恢复版本
async function restoreVersion(version: Version) {
  if (!confirm(`确定要恢复到版本 ${version.version} 吗？当前内容将被保存为新版本。`)) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data, error: fetchError } = await useFetch(
      `/api/posts/${props.postId}/versions/${version.id}/restore`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      },
    )

    if (fetchError.value) {
      throw new Error(fetchError.value.message || '恢复失败')
    }

    const result = data.value as any
    if (result?.code === 200) {
      emit('restore', result.data.post)
    }
  } catch (e: any) {
    error.value = e.message || '恢复版本失败'
  } finally {
    loading.value = false
  }
}

// 比较版本
async function startCompare(version: Version) {
  if (!compareVersionId.value) {
    selectedVersion.value = version
    compareVersionId.value = version.id
    return
  }

  if (compareVersionId.value === version.id) {
    compareVersionId.value = null
    selectedVersion.value = null
    diffResult.value = null
    return
  }

  comparing.value = true
  error.value = ''

  try {
    const { data, error: fetchError } = await useFetch(
      `/api/posts/${props.postId}/versions/compare`,
      {
        params: {
          version1: compareVersionId.value,
          version2: version.id,
        },
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      },
    )

    if (fetchError.value) {
      throw new Error(fetchError.value.message || '比较失败')
    }

    const result = data.value as any
    if (result?.code === 200) {
      diffResult.value = result.data
    }
  } catch (e: any) {
    error.value = e.message || '版本比较失败'
  } finally {
    comparing.value = false
  }
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 监听打开状态
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      loadVersions()
    } else {
      selectedVersion.value = null
      compareVersionId.value = null
      diffResult.value = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- 背景遮罩 -->
      <div
        class="absolute inset-0 bg-black bg-opacity-50"
        @click="emit('close')"
      />

      <!-- 对话框 -->
      <div
        class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
      >
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <h2 class="text-xl font-semibold">📋 版本历史</h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- 内容 -->
        <div class="flex-1 overflow-hidden flex">
          <!-- 版本列表 -->
          <div class="w-1/3 border-r overflow-y-auto">
            <div
              v-if="loading"
              class="p-4 text-center text-gray-500"
            >
              加载中...
            </div>
            <div
              v-else-if="error"
              class="p-4 text-center text-red-500"
            >
              {{ error }}
            </div>
            <div
              v-else-if="versions.length === 0"
              class="p-4 text-center text-gray-500"
            >
              暂无版本历史
            </div>
            <div
              v-else
              class="divide-y"
            >
              <div
                v-for="version in versions"
                :key="version.id"
                class="p-4 hover:bg-gray-50 cursor-pointer"
                :class="{
                  'bg-blue-50': selectedVersion?.id === version.id,
                  'bg-yellow-50': compareVersionId === version.id,
                }"
                @click="startCompare(version)"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-blue-600"> 版本 {{ version.version }} </span>
                  <span class="text-xs text-gray-500">
                    {{ formatDate(version.createdAt) }}
                  </span>
                </div>
                <div
                  v-if="version.comment"
                  class="text-sm text-gray-600 mb-2"
                >
                  {{ version.comment }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ version.author.username }}
                </div>
                <div class="mt-2 flex gap-2">
                  <button
                    class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    @click.stop="restoreVersion(version)"
                  >
                    恢复此版本
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 差异对比区域 -->
          <div class="flex-1 overflow-y-auto">
            <div
              v-if="comparing"
              class="p-4 text-center text-gray-500"
            >
              比较中...
            </div>
            <div
              v-else-if="!diffResult"
              class="p-4 text-center text-gray-500"
            >
              <p>选择两个版本进行比较</p>
              <p class="text-sm mt-2">点击第一个版本选中，再点击第二个版本开始比较</p>
            </div>
            <div
              v-else
              class="p-4"
            >
              <h3 class="font-semibold mb-4">
                版本 {{ diffResult.version1.version }} ↔ 版本 {{ diffResult.version2.version }}
              </h3>

              <!-- 标题差异 -->
              <div
                v-if="diffResult.titleChanged"
                class="mb-4 p-3 bg-yellow-50 rounded"
              >
                <div class="text-sm font-medium text-yellow-800 mb-1">标题变更</div>
                <div class="text-red-600 line-through">
                  {{ diffResult.version1.title }}
                </div>
                <div class="text-green-600">
                  {{ diffResult.version2.title }}
                </div>
              </div>

              <!-- 内容差异 -->
              <div
                v-if="diffResult.contentChanged"
                class="border rounded overflow-hidden"
              >
                <div class="bg-gray-100 px-3 py-2 text-sm font-medium">内容变更</div>
                <div class="font-mono text-sm">
                  <div
                    v-for="(line, index) in diffResult.contentDiff"
                    :key="index"
                    class="flex"
                    :class="{
                      'bg-red-50': line.type === 'removed',
                      'bg-green-50': line.type === 'added',
                    }"
                  >
                    <span class="w-12 px-2 text-gray-400 text-right select-none border-r">
                      {{ line.lineNum1 || line.lineNum2 || '' }}
                    </span>
                    <span class="w-6 text-center select-none">
                      {{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}
                    </span>
                    <span class="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
                      {{ line.line }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                v-if="!diffResult.titleChanged && !diffResult.contentChanged"
                class="text-center text-gray-500 py-4"
              >
                两个版本内容相同
              </div>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="px-6 py-3 border-t bg-gray-50 text-right">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            @click="emit('close')"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
