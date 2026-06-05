import { getOAuthAuthorizeUrl, generateOAuthState, OAUTH_PROVIDERS } from '~/server/utils/oauth'
import type { OAuthProvider } from '~/server/utils/oauth'

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider') as OAuthProvider

  // 验证提供商
  if (!provider || !(provider in OAUTH_PROVIDERS)) {
    throw createError({
      statusCode: 400,
      message: '不支持的 OAuth 提供商',
    })
  }

  // 生成 state 参数
  const state = generateOAuthState()

  // 生成授权 URL
  const authorizeUrl = getOAuthAuthorizeUrl(provider, state)

  // 将 state 存储到 cookie 中，用于回调验证
  setCookie(event, `oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 分钟
    path: '/',
  })

  return {
    code: 200,
    data: {
      authorizeUrl,
      state,
    },
  }
})
