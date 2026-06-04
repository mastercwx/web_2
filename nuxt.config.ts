// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 模块
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  devtools: { enabled: true },

  // 应用配置
  app: {
    head: {
      title: 'HG Web',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [{ name: 'description', content: 'HG Web Application' }],
    },
  },

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置
    apiSecret: '',
    // 客户端公开配置
    public: {
      apiBase: '/api',
    },
  },
  compatibilityDate: '2025-05-15',

  // Nitro 配置
  nitro: {
    preset: 'node-server',
  },

  // Vite 配置
  vite: {
    css: {
      preprocessorOptions: {},
    },
  },

  // TypeScript 配置
  typescript: {
    strict: true,
    typeCheck: true,
  },
})
