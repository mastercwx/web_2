<template>
  <div class="space-y-6">
    <div class="text-center py-12">
      <h1 class="text-4xl font-bold text-primary mb-4">欢迎来到 HG Web</h1>
      <p class="text-lg text-secondary max-w-2xl mx-auto">基于 Nuxt 3 构建的现代化 Web 应用</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <FeatureCard
        title="Nuxt 3"
        description="基于 Vue 3 的全栈框架"
        icon="⚡"
      />
      <FeatureCard
        title="TypeScript"
        description="类型安全的开发体验"
        icon="🔒"
      />
      <FeatureCard
        title="Tailwind CSS"
        description="实用优先的 CSS 框架"
        icon="🎨"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
useHead({
  title: '首页 - HG Web',
})
</script>
