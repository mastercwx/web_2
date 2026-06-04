<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <nav class="container mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="text-xl font-bold text-primary-600"
        >
          HG Web
        </NuxtLink>

        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="nav-link"
          >
            首页
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="nav-link"
          >
            关于
          </NuxtLink>

          <!-- 用户状态 -->
          <template v-if="authStore.isAuthenticated">
            <span class="text-sm text-gray-600"> 欢迎，{{ authStore.username }} </span>
            <button
              class="text-sm text-gray-500 hover:text-gray-700"
              @click="authStore.logout()"
            >
              退出
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="nav-link"
            >
              登录
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              注册
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
      <slot />
    </main>

    <footer class="bg-gray-100 border-t border-gray-200 py-4">
      <div class="container mx-auto px-4 text-center text-gray-500 text-sm">
        &copy; {{ currentYear }} HG Web. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.nav-link {
  @apply text-gray-600 hover:text-primary-600 transition-colors duration-200;
}

.nav-link.router-link-active {
  @apply text-primary-600 font-medium;
}
</style>
