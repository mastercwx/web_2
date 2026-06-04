<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['guest'],
})

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const error = ref('')

async function handleRegister() {
  // 验证表单
  if (!form.username || !form.email || !form.password || !form.confirmPassword) {
    error.value = '请填写所有必填字段'
    return
  }

  if (form.username.length < 2 || form.username.length > 50) {
    error.value = '用户名长度需要在 2-50 个字符之间'
    return
  }

  if (form.password.length < 6) {
    error.value = '密码长度不能少于 6 个字符'
    return
  }

  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    error.value = '邮箱格式不正确'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register(form.username, form.email, form.password)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">注册新账号</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          或者
          <NuxtLink
            to="/login"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            登录已有账号
          </NuxtLink>
        </p>
      </div>

      <form
        class="mt-8 space-y-6"
        @submit.prevent="handleRegister"
      >
        <div
          v-if="error"
          class="rounded-md bg-red-50 p-4"
        >
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label
              for="username"
              class="sr-only"
              >用户名</label
            >
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="用户名"
            />
          </div>
          <div>
            <label
              for="email"
              class="sr-only"
              >邮箱</label
            >
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="邮箱地址"
            />
          </div>
          <div>
            <label
              for="password"
              class="sr-only"
              >密码</label
            >
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="密码（至少 6 个字符）"
            />
          </div>
          <div>
            <label
              for="confirm-password"
              class="sr-only"
              >确认密码</label
            >
            <input
              id="confirm-password"
              v-model="form.confirmPassword"
              name="confirm-password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="确认密码"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="loading"
              class="absolute left-0 inset-y-0 flex items-center pl-3"
            >
              <svg
                class="animate-spin h-5 w-5 text-blue-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
