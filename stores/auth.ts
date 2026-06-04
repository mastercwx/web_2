import { defineStore } from 'pinia'

interface User {
  id: number
  username: string
  email: string
  role: string
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

interface AuthResponse {
  code: number
  message: string
  data: {
    user: User
    token: string
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    username: (state) => state.user?.username || '',
  },

  actions: {
    /**
     * 初始化：从 localStorage 恢复登录状态
     */
    init() {
      if (import.meta.client) {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')

        if (token && userStr) {
          try {
            this.token = token
            this.user = JSON.parse(userStr)
            this.isAuthenticated = true
          } catch {
            this.logout()
          }
        }
      }
    },

    /**
     * 登录
     */
    async login(username: string, password: string) {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      })

      if (error.value) {
        throw new Error(error.value.message || '登录失败')
      }

      const result = data.value as AuthResponse | null
      if (result?.code === 200) {
        this.setAuth(result.data.user, result.data.token)
        return result.data
      }

      throw new Error('登录失败')
    },

    /**
     * 注册
     */
    async register(username: string, email: string, password: string) {
      const { data, error } = await useFetch('/api/auth/register', {
        method: 'POST',
        body: { username, email, password },
      })

      if (error.value) {
        throw new Error(error.value.message || '注册失败')
      }

      const result = data.value as AuthResponse | null
      if (result?.code === 200) {
        this.setAuth(result.data.user, result.data.token)
        return result.data
      }

      throw new Error('注册失败')
    },

    /**
     * 获取当前用户信息
     */
    async fetchUser() {
      if (!this.token) return

      try {
        const { data, error } = await useFetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })

        if (error.value) {
          this.logout()
          return
        }

        const result = data.value as AuthResponse | null
        if (result?.code === 200) {
          this.user = result.data.user
          if (import.meta.client) {
            localStorage.setItem('user', JSON.stringify(this.user))
          }
        }
      } catch {
        this.logout()
      }
    },

    /**
     * 设置认证信息
     */
    setAuth(user: User, token: string) {
      this.user = user
      this.token = token
      this.isAuthenticated = true

      if (import.meta.client) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      }
    },

    /**
     * 登出
     */
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false

      if (import.meta.client) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }

      navigateTo('/login')
    },
  },
})
