<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const { data } = await useFetch('/api/admin/stats', {
  headers: {
    Authorization: `Bearer ${useAuthStore().token}`,
  },
})

const stats = computed(
  () =>
    (data.value as any)?.data || {
      totalUsers: 0,
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      recentUsers: [],
      recentPosts: [],
    },
)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总用户数</p>
            <p class="text-3xl font-bold text-blue-600">
              {{ stats.totalUsers }}
            </p>
          </div>
          <span class="text-4xl">👥</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总文章数</p>
            <p class="text-3xl font-bold text-green-600">
              {{ stats.totalPosts }}
            </p>
          </div>
          <span class="text-4xl">📝</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已发布</p>
            <p class="text-3xl font-bold text-purple-600">
              {{ stats.publishedPosts }}
            </p>
          </div>
          <span class="text-4xl">✅</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">草稿</p>
            <p class="text-3xl font-bold text-orange-600">
              {{ stats.draftPosts }}
            </p>
          </div>
          <span class="text-4xl">📄</span>
        </div>
      </div>
    </div>

    <!-- 最近用户和文章 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近注册用户 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">最近注册用户</h2>
        <div class="space-y-3">
          <div
            v-for="user in stats.recentUsers"
            :key="user.id"
            class="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div>
              <p class="font-medium text-gray-900">
                {{ user.username }}
              </p>
              <p class="text-sm text-gray-500">
                {{ user.email }}
              </p>
            </div>
            <span class="text-sm text-gray-400">
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- 最近文章 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">最近文章</h2>
        <div class="space-y-3">
          <div
            v-for="post in stats.recentPosts"
            :key="post.id"
            class="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div>
              <p class="font-medium text-gray-900">
                {{ post.title }}
              </p>
              <p class="text-sm text-gray-500">
                {{ post.author.username }}
              </p>
            </div>
            <span
              class="px-2 py-0.5 text-xs rounded-full"
              :class="
                post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              "
            >
              {{ post.published ? '已发布' : '草稿' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
