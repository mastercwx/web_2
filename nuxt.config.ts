// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 模块
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
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

  // 全局 CSS
  css: ['~/assets/css/main.css', '~/assets/css/theme.css'],

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置
    apiSecret: '',

    // OAuth 配置
    oauthGithubClientId: process.env.OAUTH_GITHUB_CLIENT_ID || '',
    oauthGithubClientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET || '',
    oauthGithubRedirectUri: process.env.OAUTH_GITHUB_REDIRECT_URI || '',

    oauthGoogleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
    oauthGoogleClientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
    oauthGoogleRedirectUri: process.env.OAUTH_GOOGLE_REDIRECT_URI || '',

    // 客户端公开配置
    public: {
      apiBase: '/api',
      oauthGithubClientId: process.env.OAUTH_GITHUB_CLIENT_ID || '',
      oauthGoogleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
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

  // i18n 配置
  i18n: {
    locales: [
      { code: 'zh-CN', name: '中文', file: 'zh-CN.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'zh-CN',
    langDir: 'locales/',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
})
