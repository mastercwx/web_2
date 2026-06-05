export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  // 如果已登录，重定向到首页
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
