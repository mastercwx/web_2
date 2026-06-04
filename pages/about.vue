<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-primary mb-6">
      {{ $t('about.title') }}
    </h1>

    <div class="prose prose-lg">
      <p class="text-secondary">
        {{ $t('about.description') }}
      </p>

      <h2 class="text-xl font-semibold text-primary mt-8 mb-4">
        {{ $t('about.techStack') }}
      </h2>

      <ul class="space-y-2 text-secondary">
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
const { t } = useI18n()

useHead({
  title: () => `${t('nav.about')} - ${t('common.appName')}`,
})
</script>
