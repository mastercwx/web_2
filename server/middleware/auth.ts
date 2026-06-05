import { verifyToken, extractTokenFromHeader } from '~/server/utils/jwt'

// 不需要认证的路由（前缀匹配）
const PUBLIC_ROUTE_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/2fa/login',
  '/api/auth/oauth',
  '/api/health',
]

// 公开的 GET 路由（GET 请求不需要认证）
const PUBLIC_GET_ROUTES = [
  '/api/posts',
  '/api/tags',
  '/api/users',
  '/api/series',
  '/api/search',
  '/api/comments',
  '/api/stats',
  '/api/ads/serve',
  '/api/settings/public',
  '/api/recommendations',
  '/api/translations',
  '/api/moderation/queue',
  '/api/moderation/stats',
  '/api/moderation/reports',
  '/api/moderation/comments',
]

// 公开的 POST 路由（POST 请求不需要认证）
const PUBLIC_POST_ROUTES = [
  '/api/contact',
  '/api/ads/click',
]

function isPublicRoute(path: string, method: string): boolean {
  // 前缀匹配
  if (PUBLIC_ROUTE_PREFIXES.some((route) => path.startsWith(route))) {
    return true
  }

  // GET 请求的公开路由
  if (method === 'GET' && PUBLIC_GET_ROUTES.some((route) => path.startsWith(route))) {
    return true
  }

  // POST 请求的公开路由
  if (method === 'POST' && PUBLIC_POST_ROUTES.some((route) => path.startsWith(route))) {
    return true
  }

  return false
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const method = event.method

  // 公开路由不需要认证
  if (isPublicRoute(path, method)) {
    return
  }

  // 只保护 /api 路由
  if (!path.startsWith('/api/')) {
    return
  }

  // 提取 Token
  const authHeader = getRequestHeader(event, 'Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  try {
    // 验证 Token
    const payload = verifyToken(token)

    // 将用户信息存入 event.context
    event.context['auth'] = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    }
  } catch {
    throw createError({
      statusCode: 401,
      message: '登录已过期，请重新登录',
    })
  }
})
