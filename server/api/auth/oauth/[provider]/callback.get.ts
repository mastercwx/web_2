import {
  exchangeCodeForToken,
  getOAuthUserInfo,
  findOrCreateOAuthUser,
  verifyOAuthState,
  OAUTH_PROVIDERS,
} from '~/server/utils/oauth'
import type { OAuthProvider } from '~/server/utils/oauth'

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider') as OAuthProvider
  const query = getQuery(event)

  // 验证提供商
  if (!provider || !(provider in OAUTH_PROVIDERS)) {
    throw createError({
      statusCode: 400,
      message: '不支持的 OAuth 提供商',
    })
  }

  // 获取授权码和 state
  const code = query.code as string
  const state = query.state as string

  if (!code) {
    throw createError({
      statusCode: 400,
      message: '缺少授权码',
    })
  }

  // 验证 state 参数
  const savedState = getCookie(event, `oauth_state_${provider}`)
  if (!savedState || !verifyOAuthState(state, savedState)) {
    throw createError({
      statusCode: 400,
      message: '无效的 state 参数',
    })
  }

  // 清除 state cookie
  deleteCookie(event, `oauth_state_${provider}`)

  try {
    // 交换授权码获取访问令牌
    const accessToken = await exchangeCodeForToken(provider, code)

    // 获取用户信息
    const oauthUserInfo = await getOAuthUserInfo(provider, accessToken)

    // 查找或创建用户
    const result = await findOrCreateOAuthUser(provider, oauthUserInfo, accessToken)

    // 重定向到前端，携带 token
    const redirectUrl = `/oauth/callback?token=${result.token}&isNewUser=${result.isNewUser}`
    await sendRedirect(event, redirectUrl, 302)
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    throw createError({
      statusCode: 500,
      message: 'OAuth 登录失败',
    })
  }
})
