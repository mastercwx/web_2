<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const authStore = useAuthStore()

// 分页
const page = ref(1)
const pageSize = ref(20)

// 搜索和筛选
const search = ref('')
const roleFilter = ref('ALL')
const statusFilter = ref('ALL')
const dateFrom = ref('')
const dateTo = ref('')
const minPosts = ref('')
const maxPosts = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 批量操作
const selectedUsers = ref<number[]>([])
const bulkAction = ref('')
const bulkRole = ref('')

// UI 状态
const activeTab = ref<'list' | 'stats'>('list')
const showUserDetail = ref(false)
const selectedUserId = ref<number | null>(null)

// 获取用户列表
const { data, refresh } = await useFetch('/api/admin/users/advanced', {
  query: computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value || undefined,
    role: roleFilter.value !== 'ALL' ? roleFilter.value : undefined,
    status: statusFilter.value !== 'ALL' ? statusFilter.value : undefined,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
    minPosts: minPosts.value || undefined,
    maxPosts: maxPosts.value || undefined,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
  })),
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const users = computed(() => (data.value as any)?.data?.users || [])
const pagination = computed(() => (data.value as any)?.data?.pagination || {})

// 获取用户统计概览
const { data: statsData } = await useFetch('/api/admin/users/stats-overview', {
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const stats = computed(() => (statsData.value as any)?.data || {})

// 用户详情数据
const userDetail = ref<any>(null)
const userStats = ref<any>(null)

// 搜索处理
function handleSearch() {
  page.value = 1
  refresh()
}

// 重置筛选
function resetFilters() {
  search.value = ''
  roleFilter.value = 'ALL'
  statusFilter.value = 'ALL'
  dateFrom.value = ''
  dateTo.value = ''
  minPosts.value = ''
  maxPosts.value = ''
  sortBy.value = 'createdAt'
  sortOrder.value = 'desc'
  page.value = 1
  refresh()
}

// 分页处理
function handlePageChange(newPage: number) {
  page.value = newPage
  refresh()
}

// 排序处理
function handleSort(field: string) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
  refresh()
}

// 全选/取消全选
function toggleSelectAll() {
  if (selectedUsers.value.length === users.value.length) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = users.value.map((u: any) => u.id)
  }
}

// 切换单个选择
function toggleSelect(userId: number) {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

// 批量操作
async function handleBulkAction() {
  if (!bulkAction.value || selectedUsers.value.length === 0) {
    return
  }

  const confirmed = confirm(`确定要对 ${selectedUsers.value.length} 个用户执行此操作吗？`)
  if (!confirmed) return

  try {
    const result = await $fetch('/api/admin/users/bulk', {
      method: 'POST',
      body: {
        userIds: selectedUsers.value,
        action: bulkAction.value,
        role: bulkAction.value === 'changeRole' ? bulkRole.value : undefined,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    const data = result as any
    alert(`操作完成：成功 ${data.data.success} 个，失败 ${data.data.failed} 个`)
    selectedUsers.value = []
    bulkAction.value = ''
    refresh()
  } catch (error: any) {
    alert(`操作失败：${error.message}`)
  }
}

// 单个用户操作
async function handleRoleChange(userId: number, role: string) {
  await $fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: { role },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

async function handleStatusChange(userId: number, status: string) {
  await $fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: { status },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

async function handleDelete(userId: number) {
  if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) return

  await $fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

// 查看用户详情
async function viewUserDetail(userId: number) {
  selectedUserId.value = userId
  showUserDetail.value = true

  try {
    const [detailRes, statsRes] = await Promise.all([
      $fetch(`/api/admin/users/${userId}/detail`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      }),
      $fetch(`/api/admin/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      }),
    ])

    userDetail.value = (detailRes as any).data
    userStats.value = (statsRes as any).data
  } catch (error: any) {
    alert(`获取用户详情失败：${error.message}`)
  }
}

// 关闭详情
function closeDetail() {
  showUserDetail.value = false
  selectedUserId.value = null
  userDetail.value = null
  userStats.value = null
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// 角色映射
const roleMap: Record<string, string> = {
  USER: '普通用户',
  ADMIN: '管理员',
  GUEST: '访客',
}

// 状态映射
const statusMap: Record<string, string> = {
  ACTIVE: '正常',
  INACTIVE: '未激活',
  BANNED: '封禁',
}

// 角色颜色
function getRoleColor(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800'
    case 'USER':
      return 'bg-blue-100 text-blue-800'
    case 'GUEST':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 状态颜色
function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'INACTIVE':
      return 'bg-yellow-100 text-yellow-800'
    case 'BANNED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">高级用户管理</h1>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            activeTab === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click="activeTab = 'list'"
        >
          用户列表
        </button>
        <button
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            activeTab === 'stats'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click="activeTab = 'stats'"
        >
          统计概览
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div
      v-if="activeTab === 'stats'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-500">总用户数</div>
        <div class="text-3xl font-bold text-gray-900">
          {{ formatNumber(stats.totalUsers || 0) }}
        </div>
        <div class="text-sm text-gray-500 mt-2">
          活跃: {{ stats.activeUsers || 0 }} | 封禁: {{ stats.bannedUsers || 0 }}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-500">今日新增</div>
        <div class="text-3xl font-bold text-green-600">+{{ stats.newUsersToday || 0 }}</div>
        <div class="text-sm text-gray-500 mt-2">
          本周: {{ stats.newUsersThisWeek || 0 }} | 本月: {{ stats.newUsersThisMonth || 0 }}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-500">角色分布</div>
        <div class="space-y-2 mt-2">
          <div
            v-for="role in stats.usersByRole || []"
            :key="role.role"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-600">{{ roleMap[role.role] || role.role }}</span>
            <span class="font-medium">{{ role.count }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-500">状态分布</div>
        <div class="space-y-2 mt-2">
          <div
            v-for="status in stats.usersByStatus || []"
            :key="status.status"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-600">{{ statusMap[status.status] || status.status }}</span>
            <span class="font-medium">{{ status.count }}</span>
          </div>
        </div>
      </div>

      <!-- 活跃用户排行 -->
      <div class="md:col-span-2 bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">文章排行 Top 10</h3>
        <div class="space-y-3">
          <div
            v-for="(user, index) in stats.topPosters || []"
            :key="user.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-gray-400 w-6">
                {{ index + 1 }}
              </span>
              <img
                :src="user.avatar || '/default-avatar.svg'"
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm font-medium">
                {{ user.username }}
              </span>
            </div>
            <span class="text-sm text-gray-500"> {{ user.postCount }} 篇文章 </span>
          </div>
        </div>
      </div>

      <div class="md:col-span-2 bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">评论排行 Top 10</h3>
        <div class="space-y-3">
          <div
            v-for="(user, index) in stats.topCommenters || []"
            :key="user.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-gray-400 w-6">
                {{ index + 1 }}
              </span>
              <img
                :src="user.avatar || '/default-avatar.svg'"
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm font-medium">
                {{ user.username }}
              </span>
            </div>
            <span class="text-sm text-gray-500"> {{ user.commentCount }} 条评论 </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div
      v-if="activeTab === 'list'"
      class="space-y-4"
    >
      <!-- 高级筛选 -->
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- 搜索 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              v-model="search"
              type="text"
              placeholder="用户名/邮箱/简介..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 角色筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              v-model="roleFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">全部角色</option>
              <option value="USER">普通用户</option>
              <option value="ADMIN">管理员</option>
              <option value="GUEST">访客</option>
            </select>
          </div>

          <!-- 状态筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">全部状态</option>
              <option value="ACTIVE">正常</option>
              <option value="INACTIVE">未激活</option>
              <option value="BANNED">封禁</option>
            </select>
          </div>

          <!-- 日期范围 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">注册日期从</label>
            <input
              v-model="dateFrom"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">注册日期至</label>
            <input
              v-model="dateTo"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- 文章数量 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">最少文章数</label>
            <input
              v-model="minPosts"
              type="number"
              placeholder="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">最多文章数</label>
            <input
              v-model="maxPosts"
              type="number"
              placeholder="不限"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-end gap-2">
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              @click="handleSearch"
            >
              搜索
            </button>
            <button
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              @click="resetFilters"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <div
        v-if="selectedUsers.length > 0"
        class="bg-white rounded-lg shadow-md p-4"
      >
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600"> 已选择 {{ selectedUsers.length }} 个用户 </span>
          <select
            v-model="bulkAction"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">选择操作</option>
            <option value="ban">批量封禁</option>
            <option value="unban">批量解封</option>
            <option value="activate">批量激活</option>
            <option value="deactivate">批量停用</option>
            <option value="delete">批量删除</option>
            <option value="changeRole">批量修改角色</option>
          </select>

          <select
            v-if="bulkAction === 'changeRole'"
            v-model="bulkRole"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="USER">普通用户</option>
            <option value="ADMIN">管理员</option>
            <option value="GUEST">访客</option>
          </select>

          <button
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            :disabled="!bulkAction"
            @click="handleBulkAction"
          >
            执行
          </button>

          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            @click="selectedUsers = []"
          >
            取消选择
          </button>
        </div>
      </div>

      <!-- 用户表格 -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    :checked="selectedUsers.length === users.length && users.length > 0"
                    class="rounded"
                    @change="toggleSelectAll"
                  />
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  @click="handleSort('id')"
                >
                  ID
                  <span v-if="sortBy === 'id'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  @click="handleSort('username')"
                >
                  用户名
                  <span v-if="sortBy === 'username'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  @click="handleSort('email')"
                >
                  邮箱
                  <span v-if="sortBy === 'email'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  角色
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  @click="handleSort('posts')"
                >
                  文章数
                  <span v-if="sortBy === 'posts'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  评论/点赞
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  @click="handleSort('createdAt')"
                >
                  注册时间
                  <span v-if="sortBy === 'createdAt'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="selectedUsers.includes(user.id)"
                    class="rounded"
                    @change="toggleSelect(user.id)"
                  />
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ user.id }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img
                      :src="user.avatar || '/default-avatar.svg'"
                      class="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.username }}
                      </div>
                      <div
                        v-if="user.bio"
                        class="text-xs text-gray-500 truncate max-w-[200px]"
                      >
                        {{ user.bio }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ user.email }}
                </td>
                <td class="px-4 py-3">
                  <select
                    :value="user.role"
                    class="text-xs border rounded px-2 py-1"
                    :class="getRoleColor(user.role)"
                    @change="handleRoleChange(user.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="USER">普通用户</option>
                    <option value="ADMIN">管理员</option>
                    <option value="GUEST">访客</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <select
                    :value="user.status"
                    class="text-xs border rounded px-2 py-1"
                    :class="getStatusColor(user.status)"
                    @change="
                      handleStatusChange(user.id, ($event.target as HTMLSelectElement).value)
                    "
                  >
                    <option value="ACTIVE">正常</option>
                    <option value="INACTIVE">未激活</option>
                    <option value="BANNED">封禁</option>
                  </select>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ user._count.posts }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ user._count.comments }} / {{ user._count.likes }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ new Date(user.createdAt).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex gap-2">
                    <button
                      class="text-blue-600 hover:text-blue-800"
                      @click="viewUserDetail(user.id)"
                    >
                      详情
                    </button>
                    <button
                      class="text-red-600 hover:text-red-800"
                      @click="handleDelete(user.id)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex justify-between items-center"
      >
        <div class="text-sm text-gray-500">
          共 {{ pagination.total }} 条记录，第 {{ pagination.page }} /
          {{ pagination.totalPages }} 页
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 rounded-md border"
            :disabled="page <= 1"
            @click="handlePageChange(page - 1)"
          >
            上一页
          </button>
          <template
            v-for="p in pagination.totalPages"
            :key="p"
          >
            <button
              v-if="p === 1 || p === pagination.totalPages || (p >= page - 2 && p <= page + 2)"
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
            :disabled="page >= pagination.totalPages"
            @click="handlePageChange(page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 用户详情弹窗 -->
    <div
      v-if="showUserDetail"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h2 class="text-xl font-bold">用户详情</h2>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="closeDetail"
            >
              ✕
            </button>
          </div>

          <div
            v-if="userDetail"
            class="space-y-6"
          >
            <!-- 基本信息 -->
            <div class="flex items-start gap-6">
              <img
                :src="userDetail.avatar || '/default-avatar.svg'"
                class="w-20 h-20 rounded-full"
              />
              <div class="flex-1">
                <h3 class="text-lg font-semibold">
                  {{ userDetail.username }}
                </h3>
                <p class="text-gray-500">
                  {{ userDetail.email }}
                </p>
                <div class="flex gap-2 mt-2">
                  <span
                    class="px-2 py-1 rounded text-xs"
                    :class="getRoleColor(userDetail.role)"
                  >
                    {{ roleMap[userDetail.role] }}
                  </span>
                  <span
                    class="px-2 py-1 rounded text-xs"
                    :class="getStatusColor(userDetail.status)"
                  >
                    {{ statusMap[userDetail.status] }}
                  </span>
                  <span
                    v-if="userDetail.emailVerified"
                    class="px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                  >
                    邮箱已验证
                  </span>
                  <span
                    v-if="userDetail.twoFactorEnabled"
                    class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                  >
                    2FA 已启用
                  </span>
                  <span
                    v-if="userDetail.oauthProvider"
                    class="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
                  >
                    {{ userDetail.oauthProvider }}
                  </span>
                </div>
                <p
                  v-if="userDetail.bio"
                  class="text-gray-600 mt-2"
                >
                  {{ userDetail.bio }}
                </p>
              </div>
            </div>

            <!-- 统计数据 -->
            <div
              v-if="userStats"
              class="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.totalPosts }}
                </div>
                <div class="text-sm text-gray-500">文章总数</div>
                <div class="text-xs text-gray-400">本月 +{{ userStats.postsThisMonth }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.totalComments }}
                </div>
                <div class="text-sm text-gray-500">评论总数</div>
                <div class="text-xs text-gray-400">本月 +{{ userStats.commentsThisMonth }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.totalLikes }}
                </div>
                <div class="text-sm text-gray-500">点赞总数</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.totalFavorites }}
                </div>
                <div class="text-sm text-gray-500">收藏总数</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.totalFollowers }}
                </div>
                <div class="text-sm text-gray-500">粉丝数</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.totalFollowing }}
                </div>
                <div class="text-sm text-gray-500">关注数</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.averagePostsPerMonth }}
                </div>
                <div class="text-sm text-gray-500">月均发文</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ userStats.accountAge }}
                </div>
                <div class="text-sm text-gray-500">注册月数</div>
              </div>
            </div>

            <!-- 最近文章 -->
            <div>
              <h4 class="font-semibold mb-3">最近文章</h4>
              <div class="space-y-2">
                <div
                  v-for="post in userDetail.recentPosts"
                  :key="post.id"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <div class="font-medium">
                      {{ post.title }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ new Date(post.createdAt).toLocaleDateString() }}
                    </div>
                  </div>
                  <span
                    class="px-2 py-1 rounded text-xs"
                    :class="
                      post.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    "
                  >
                    {{ post.status === 'PUBLISHED' ? '已发布' : '草稿' }}
                  </span>
                </div>
                <div
                  v-if="userDetail.recentPosts.length === 0"
                  class="text-gray-500 text-center py-4"
                >
                  暂无文章
                </div>
              </div>
            </div>

            <!-- 最近活动 -->
            <div>
              <h4 class="font-semibold mb-3">最近活动</h4>
              <div class="space-y-2">
                <div
                  v-for="activity in userDetail.recentActivity"
                  :key="activity.id"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <div class="font-medium">
                      {{ activity.action }}
                    </div>
                    <div
                      v-if="activity.details"
                      class="text-sm text-gray-500"
                    >
                      {{ activity.details }}
                    </div>
                  </div>
                  <div class="text-sm text-gray-400">
                    {{ new Date(activity.createdAt).toLocaleString() }}
                  </div>
                </div>
                <div
                  v-if="userDetail.recentActivity.length === 0"
                  class="text-gray-500 text-center py-4"
                >
                  暂无活动记录
                </div>
              </div>
            </div>

            <!-- 账户信息 -->
            <div>
              <h4 class="font-semibold mb-3">账户信息</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">注册时间：</span>
                  <span>{{ new Date(userDetail.createdAt).toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-gray-500">最后更新：</span>
                  <span>{{ new Date(userDetail.updatedAt).toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-gray-500">最后活跃：</span>
                  <span>{{
                    userStats?.lastActiveAt
                      ? new Date(userStats.lastActiveAt).toLocaleString()
                      : '无记录'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-500">用户 ID：</span>
                  <span>{{ userDetail.id }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-8"
          >
            加载中...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
