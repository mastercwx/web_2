<template>
  <div class="oauth-callback-page">
    <div class="callback-container">
      <div class="loading-spinner" />
      <p>{{ statusMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()

const statusMessage = ref('正在完成登录...')

onMounted(async () => {
  const token = route.query.token as string
  const isNewUser = route.query.isNewUser === 'true'

  if (!token) {
    statusMessage.value = '登录失败：缺少令牌'
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
    return
  }

  try {
    // 保存 token
    localStorage.setItem('token', token)

    // 获取用户信息
    const { data, error } = await useFetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (error.value) {
      throw new Error('获取用户信息失败')
    }

    const result = data.value as { code: number; data: { user: any } } | null
    if (result?.code === 200 && result.data.user) {
      authStore.setAuth(result.data.user, token)

      statusMessage.value = isNewUser ? '注册成功！正在跳转...' : '登录成功！正在跳转...'

      setTimeout(() => {
        navigateTo('/')
      }, 1000)
    } else {
      throw new Error('获取用户信息失败')
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    statusMessage.value = '登录失败：' + (error.message || '未知错误')
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  }
})
</script>

<style scoped>
.oauth-callback-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
}

.callback-container {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

p {
  color: var(--color-text-primary);
  font-size: 1rem;
}
</style>
