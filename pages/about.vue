<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">关于我们</h1>

    <div class="prose prose-lg">
      <p class="text-gray-600">
        HG Web 是一个基于 Nuxt 3 构建的现代化 Web 应用，采用最新的前端技术栈，
        致力于提供优秀的用户体验和开发体验。
      </p>

      <h2 class="text-xl font-semibold text-gray-800 mt-8 mb-4">技术栈</h2>

      <ul class="space-y-2 text-gray-600">
        <li class="flex items-center gap-2">
          <span class="w-2 h-2 bg-primary-500 rounded-full" />
          Nuxt 3.16.2 - Vue 3 全栈框架
        </li>
        <li class="flex items-center gap-2">
          <span class="w-2 h-2 bg-primary-500 rounded-full" />
          TypeScript - 类型安全
        </li>
        <li class="flex items-center gap-2">
          <span class="w-2 h-2 bg-primary-500 rounded-full" />
          Pinia - 状态管理
        </li>
        <li class="flex items-center gap-2">
          <span class="w-2 h-2 bg-primary-500 rounded-full" />
          Tailwind CSS - 样式框架
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '关于 - HG Web',
})
</script>
