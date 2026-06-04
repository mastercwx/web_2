<script setup lang="ts">
const authStore = useAuthStore()

const sidebarItems = [
  { label: '仪表盘', icon: '📊', to: '/admin' },
  { label: '用户管理', icon: '👥', to: '/admin/users' },
  { label: '文章管理', icon: '📝', to: '/admin/posts' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="flex items-center justify-between px-6 py-3">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/admin"
            class="text-xl font-bold text-blue-600"
          >
            HG Web 管理后台
          </NuxtLink>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">
            {{ authStore.username }}
          </span>
          <NuxtLink
            to="/"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            返回前台
          </NuxtLink>
          <button
            class="text-sm text-gray-500 hover:text-gray-700"
            @click="authStore.logout()"
          >
            退出
          </button>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- 侧边栏 -->
      <aside class="w-64 bg-white shadow-sm min-h-[calc(100vh-57px)]">
        <nav class="p-4 space-y-2">
          <NuxtLink
            v-for="item in sidebarItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            active-class="bg-blue-50 text-blue-600"
          >
            <span>{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- 主内容 -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
