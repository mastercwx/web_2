import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  isDark: boolean
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    theme: 'system',
    isDark: false,
  }),

  actions: {
    init() {
      if (import.meta.client) {
        // 从 localStorage 获取保存的主题
        const saved = localStorage.getItem('theme') as Theme | null
        if (saved) {
          this.theme = saved
        }
        this.applyTheme()
        this.watchSystemTheme()
      }
    },

    setTheme(theme: Theme) {
      this.theme = theme
      if (import.meta.client) {
        localStorage.setItem('theme', theme)
      }
      this.applyTheme()
    },

    toggleTheme() {
      const themes: Theme[] = ['light', 'dark', 'system']
      const currentIndex = themes.indexOf(this.theme)
      const nextIndex = (currentIndex + 1) % themes.length
      this.setTheme(themes[nextIndex] || 'light')
    },

    applyTheme() {
      if (!import.meta.client) return

      const html = document.documentElement

      if (this.theme === 'system') {
        this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      } else {
        this.isDark = this.theme === 'dark'
      }

      if (this.isDark) {
        html.classList.add('dark')
        html.setAttribute('data-theme', 'dark')
      } else {
        html.classList.remove('dark')
        html.setAttribute('data-theme', 'light')
      }
    },

    watchSystemTheme() {
      if (!import.meta.client) return

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (this.theme === 'system') {
          this.applyTheme()
        }
      })
    },
  },
})
