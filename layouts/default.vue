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
        <div class="flex gap-4">
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
