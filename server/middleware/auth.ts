import { verifyToken, extractTokenFromHeader } from '~/server/utils/jwt'

// 不需要认证的路由
const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/health']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // 公开路由不需要认证
  if (PUBLIC_ROUTES.some((route) => path.startsWith(route))) {
    return
  }

  // 只保护 /api 路由（除了公开的）
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
