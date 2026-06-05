<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const authStore = useAuthStore()

const page = ref(1)
const search = ref('')
const publishedFilter = ref('')

const { data, refresh } = await useFetch('/api/admin/posts', {
  query: { page, pageSize: 10, search, published: publishedFilter },
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const posts = computed(() => (data.value as any)?.data?.posts || [])
const pagination = computed(() => (data.value as any)?.data?.pagination || {})

async function handleTogglePublish(postId: number, published: boolean) {
  await $fetch(`/api/admin/posts/${postId}`, {
    method: 'PUT',
    body: { published: !published },
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

async function handleTogglePin(postId: number) {
  await $fetch(`/api/posts/${postId}/pin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

async function handleToggleFeature(postId: number) {
  await $fetch(`/api/posts/${postId}/feature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })
  refresh()
}

async function handleDelete(postId: number) {
  if (!confirm('确定要删除这篇文章吗？')) return

  await $fetch(`/api/admin/posts/${postId}`, {
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

function handlePageChange(newPage: number) {
  page.value = newPage
  refresh()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">文章管理</h1>
      <div class="flex gap-4">
        <select
          v-model="publishedFilter"
          class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="handleSearch"
        >
          <option value="">全部状态</option>
          <option value="true">已发布</option>
          <option value="false">草稿</option>
        </select>
        <input
          v-model="search"
          type="text"
          placeholder="搜索文章..."
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标签</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              创建时间
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="post in posts"
            :key="post.id"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ post.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <NuxtLink
                :to="`/posts/${post.slug}`"
                class="text-sm text-blue-600 hover:underline"
              >
                {{ post.title }}
              </NuxtLink>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ post.author.username }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex gap-1">
                <span
                  v-for="tag in post.tags"
                  :key="tag.id"
                  class="px-2 py-0.5 text-xs bg-gray-100 rounded"
                >
                  {{ tag.name }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex gap-1">
                <span
                  class="px-2 py-0.5 text-xs rounded-full cursor-pointer"
                  :class="
                    post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  "
                  @click="handleTogglePublish(post.id, post.published)"
                >
                  {{ post.published ? '已发布' : '草稿' }}
                </span>
                <span
                  v-if="post.pinned"
                  class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 cursor-pointer"
                  @click="handleTogglePin(post.id)"
                >
                  📌 置顶
                </span>
                <span
                  v-if="post.featured"
                  class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 cursor-pointer"
                  @click="handleToggleFeature(post.id)"
                >
                  ⭐ 推荐
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(post.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
              <NuxtLink
                :to="`/posts/${post.slug}/edit`"
                class="text-blue-600 hover:text-blue-900"
              >
                编辑
              </NuxtLink>
              <button
                class="hover:text-blue-900"
                :class="post.pinned ? 'text-blue-600' : 'text-gray-500'"
                @click="handleTogglePin(post.id)"
              >
                {{ post.pinned ? '取消置顶' : '置顶' }}
              </button>
              <button
                class="hover:text-purple-900"
                :class="post.featured ? 'text-purple-600' : 'text-gray-500'"
                @click="handleToggleFeature(post.id)"
              >
                {{ post.featured ? '取消推荐' : '推荐' }}
              </button>
              <button
                class="text-red-600 hover:text-red-900"
                @click="handleDelete(post.id)"
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
        @click="handlePageChange(p)"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>
