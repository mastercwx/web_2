<script setup lang="ts">
defineProps<{
  error: {
    statusCode: number
    message: string
  }
}>()

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center error-layout">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold error-code">
          {{ error.statusCode }}
        </h1>
        <p class="text-2xl text-primary mt-4">
          <template v-if="error.statusCode === 404"> 页面不存在 </template>
          <template v-else-if="error.statusCode === 403"> 没有权限访问 </template>
          <template v-else-if="error.statusCode === 500"> 服务器错误 </template>
          <template v-else>
            {{ error.message || '出错了' }}
          </template>
        </p>
      </div>

      <div class="space-y-4">
        <button
          class="btn-primary"
          @click="handleError"
        >
          返回首页
        </button>

        <p class="text-sm text-secondary">
          <template v-if="error.statusCode === 404"> 你访问的页面可能已被删除或不存在 </template>
          <template v-else-if="error.statusCode === 403"> 请联系管理员获取权限 </template>
          <template v-else-if="error.statusCode === 500"> 请稍后再试，或联系管理员 </template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-layout {
  background: var(--bg-secondary);
}

.error-code {
  color: var(--text-tertiary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  color: var(--text-inverse);
  background: var(--color-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}
</style>
