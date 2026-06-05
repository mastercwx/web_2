import { checkRateLimit, setRateLimitHeaders, RateLimits } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  // 只对 API 路由进行速率限制
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) {
    return
  }

  // 跳过静态资源
  if (path.includes('.')) {
    return
  }

  // 根据路径选择不同的速率限制配置
  let config = RateLimits.api
  const method = event.node.req.method

  // 认证相关
  if (path.startsWith('/api/auth/login')) {
    config = RateLimits.auth
  } else if (path.startsWith('/api/auth/register')) {
    config = RateLimits.register
  } else if (path.startsWith('/api/auth/reset-password') || path.startsWith('/api/auth/forgot-password')) {
    config = RateLimits.passwordReset
  }
  // 文件上传（仅 POST）
  else if (path.startsWith('/api/media') && method === 'POST') {
    config = RateLimits.upload
  }
  // 评论（仅 POST/PUT/DELETE，GET 不限制）
  else if (path.startsWith('/api/comments') && method !== 'GET') {
    config = RateLimits.comment
  }
  // 搜索
  else if (path.startsWith('/api/search')) {
    config = RateLimits.search
  }

  const result = checkRateLimit(event, config)

  // 设置响应头
  setRateLimitHeaders(event, result, config.max)

  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      message: config.message || '请求过于频繁，请稍后再试',
    })
  }
})
