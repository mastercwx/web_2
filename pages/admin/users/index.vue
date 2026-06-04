<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const authStore = useAuthStore()

const page = ref(1)
const search = ref('')

const { data, refresh } = await useFetch('/api/admin/users', {
  query: { page, pageSize: 10, search },
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const users = computed(() => (data.value as any)?.data?.users || [])
const pagination = computed(() => (data.value as any)?.data?.pagination || {})

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
  if (!confirm('确定要删除这个用户吗？')) return

  await $fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

function handleSearch() {
  page.value = 1
  refresh()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
      <div class="flex gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="搜索用户..."
          class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleSearch"
        />
        <button
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">文章数</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              注册时间
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="user in users"
            :key="user.id"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ user.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ user.username }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                :value="user.role"
                class="text-sm border rounded px-2 py-1"
                @change="handleRoleChange(user.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="USER">普通用户</option>
                <option value="ADMIN">管理员</option>
                <option value="GUEST">访客</option>
              </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                :value="user.status"
                class="text-sm border rounded px-2 py-1"
                @change="handleStatusChange(user.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="ACTIVE">正常</option>
                <option value="INACTIVE">未激活</option>
                <option value="BANNED">封禁</option>
              </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user._count.posts }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                class="text-red-600 hover:text-red-900"
                @click="handleDelete(user.id)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div
      v-if="pagination.totalPages > 1"
      class="mt-6 flex justify-center gap-2"
    >
      <button
        v-for="p in pagination.totalPages"
        :key="p"
        class="px-4 py-2 rounded-md transition-colors"
        :class="p === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
        @click="
          page = p
          refresh()
        "
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>
