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
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold text-gray-300">
          {{ error.statusCode }}
        </h1>
        <p class="text-2xl text-gray-600 mt-4">
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
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          @click="handleError"
        >
          返回首页
        </button>

        <p class="text-sm text-gray-500">
          <template v-if="error.statusCode === 404"> 你访问的页面可能已被删除或不存在 </template>
          <template v-else-if="error.statusCode === 403"> 请联系管理员获取权限 </template>
          <template v-else-if="error.statusCode === 500"> 请稍后再试，或联系管理员 </template>
        </p>
      </div>
    </div>
  </div>
</template>
