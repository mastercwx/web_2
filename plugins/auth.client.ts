export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // 在客户端初始化认证状态
  authStore.init()
})
