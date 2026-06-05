import { prisma } from '~/server/utils/prisma'
import { generateToken } from '~/server/utils/jwt'

// OAuth 提供商配置
export const OAUTH_PROVIDERS = {
  github: {
    name: 'GitHub',
    icon: 'github',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
  },
  google: {
    name: 'Google',
    icon: 'google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
} as const

export type OAuthProvider = keyof typeof OAUTH_PROVIDERS

interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface OAuthUserInfo {
  id: string
  email: string
  name: string
  avatar?: string
  username?: string
}

/**
 * 获取 OAuth 配置
 */
export function getOAuthConfig(provider: OAuthProvider): OAuthConfig {
  const config = useRuntimeConfig()

  const providerConfig = {
    github: {
      clientId: config.oauthGithubClientId,
      clientSecret: config.oauthGithubClientSecret,
      redirectUri: config.oauthGithubRedirectUri,
    },
    google: {
      clientId: config.oauthGoogleClientId,
      clientSecret: config.oauthGoogleClientSecret,
      redirectUri: config.oauthGoogleRedirectUri,
    },
  }

  return providerConfig[provider]
}

/**
 * 生成 OAuth 授权 URL
 */
export function getOAuthAuthorizeUrl(provider: OAuthProvider, state: string): string {
  const config = getOAuthConfig(provider)
  const providerInfo = OAUTH_PROVIDERS[provider]

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: provider === 'github' ? 'user:email' : 'openid email profile',
    response_type: 'code',
  })

  return `${providerInfo.authorizeUrl}?${params.toString()}`
}

/**
 * 交换授权码获取访问令牌
 */
export async function exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<string> {
  const config = getOAuthConfig(provider)
  const providerInfo = OAUTH_PROVIDERS[provider]

  const response = await $fetch<{ access_token: string }>(providerInfo.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    },
  })

  return response.access_token
}

/**
 * 获取 OAuth 用户信息
 */
export async function getOAuthUserInfo(
  provider: OAuthProvider,
  accessToken: string,
): Promise<OAuthUserInfo> {
  const providerInfo = OAUTH_PROVIDERS[provider]

  if (provider === 'github') {
    const user = await $fetch<{
      id: number
      email: string
      name: string
      avatar_url: string
      login: string
    }>(providerInfo.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    return {
      id: String(user.id),
      email: user.email,
      name: user.name || user.login,
      avatar: user.avatar_url,
      username: user.login,
    }
  }

  // Google
  const user = await $fetch<{
    id: string
    email: string
    name: string
    picture: string
  }>(providerInfo.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.picture,
  }
}

/**
 * 查找或创建 OAuth 用户
 */
export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  oauthUserInfo: OAuthUserInfo,
  accessToken: string,
  refreshToken?: string,
): Promise<{ user: any; token: string; isNewUser: boolean }> {
  // 查找现有 OAuth 账号
  let oauthAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerId: {
        provider,
        providerId: oauthUserInfo.id,
      },
    },
    include: {
      user: true,
    },
  })

  // 如果找到现有账号，更新令牌并返回用户
  if (oauthAccount) {
    await prisma.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        accessToken,
        refreshToken,
      },
    })

    const token = generateToken({
      userId: oauthAccount.user.id,
      username: oauthAccount.user.username,
      role: oauthAccount.user.role,
    })

    return {
      user: oauthAccount.user,
      token,
      isNewUser: false,
    }
  }

  // 查找是否有相同邮箱的用户
  let user = await prisma.user.findUnique({
    where: { email: oauthUserInfo.email },
  })

  // 如果没有用户，创建新用户
  if (!user) {
    // 生成唯一的用户名
    let username = oauthUserInfo.username || oauthUserInfo.name.replace(/\s+/g, '').toLowerCase()
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      username = `${username}_${Date.now()}`
    }

    user = await prisma.user.create({
      data: {
        username,
        email: oauthUserInfo.email,
        password: '', // OAuth 用户没有密码
        avatar: oauthUserInfo.avatar,
        emailVerified: true, // OAuth 邮箱视为已验证
      },
    })
  }

  // 创建 OAuth 账号关联
  oauthAccount = await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider,
      providerId: oauthUserInfo.id,
      accessToken,
      refreshToken,
    },
    include: {
      user: true,
    },
  })

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  return {
    user,
    token,
    isNewUser: true,
  }
}

/**
 * 生成 OAuth state 参数（用于 CSRF 防护）
 */
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 验证 OAuth state 参数
 */
export function verifyOAuthState(state: string, expectedState: string): boolean {
  return state === expectedState
}
