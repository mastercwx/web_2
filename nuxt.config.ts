// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 模块
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  devtools: { enabled: true },

  // 应用配置
  app: {
    head: {
      title: 'HG Web',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'description', content: 'HG Web Application' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
    },
  },

  // 全局 CSS
  css: ['~/assets/css/main.css', '~/assets/css/theme.css'],

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置
    apiSecret: '',

    // OAuth 配置
    oauthGithubClientId: process.env['OAUTH_GITHUB_CLIENT_ID'] || '',
    oauthGithubClientSecret: process.env['OAUTH_GITHUB_CLIENT_SECRET'] || '',
    oauthGithubRedirectUri: process.env['OAUTH_GITHUB_REDIRECT_URI'] || '',

    oauthGoogleClientId: process.env['OAUTH_GOOGLE_CLIENT_ID'] || '',
    oauthGoogleClientSecret: process.env['OAUTH_GOOGLE_CLIENT_SECRET'] || '',
    oauthGoogleRedirectUri: process.env['OAUTH_GOOGLE_REDIRECT_URI'] || '',

    // 客户端公开配置
    public: {
      apiBase: '/api',
      oauthGithubClientId: process.env['OAUTH_GITHUB_CLIENT_ID'] || '',
      oauthGoogleClientId: process.env['OAUTH_GOOGLE_CLIENT_ID'] || '',
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

  // PWA 配置
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'HG Web',
      short_name: 'HG Web',
      description: 'HG Web Application - 现代化内容管理系统',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /\/api\/.+json/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24,
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /\/_nuxt\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'nuxt-assets-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
