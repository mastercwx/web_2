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

  // 认证相关
  if (path.includes('/auth/login')) {
    config = RateLimits.auth
  } else if (path.includes('/auth/register')) {
    config = RateLimits.register
  } else if (path.includes('/auth/reset-password') || path.includes('/auth/forgot-password')) {
    config = RateLimits.passwordReset
  }
  // 文件上传
  else if (path.includes('/media') && event.node.req.method === 'POST') {
    config = RateLimits.upload
  }
  // 评论
  else if (path.includes('/comments')) {
    config = RateLimits.comment
  }
  // 搜索
  else if (path.includes('/search')) {
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
