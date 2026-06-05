export default defineNuxtRouteMiddleware((_to) => {
  const authStore = useAuthStore()

  // 如果未登录，重定向到登录页
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
