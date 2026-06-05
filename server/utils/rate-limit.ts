// 内存存储（生产环境建议使用 Redis）
const store = new Map<string, { count: number; resetTime: number }>()

// 定期清理过期记录
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key)
    }
  }
}, 60000) // 每分钟清理一次

export interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  max: number // 最大请求数
  message?: string // 超限提示信息
  keyGenerator?: (event: any) => string // 自定义 key 生成器
}

// 默认 key 生成器：基于 IP
function getDefaultKey(event: any): string {
  const headers = event.node.req.headers
  const ip =
    (headers['x-forwarded-for'] as string) ||
    (headers['x-real-ip'] as string) ||
    event.node.req.socket.remoteAddress ||
    'unknown'
  return `rate_limit:${ip}`
}

// 速率限制检查
export function checkRateLimit(
  event: any,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = config.keyGenerator ? config.keyGenerator(event) : getDefaultKey(event)
  const now = Date.now()

  let record = store.get(key)

  // 如果没有记录或已过期，创建新记录
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    store.set(key, record)
  }

  // 增加请求计数
  record.count++

  // 检查是否超限
  const allowed = record.count <= config.max
  const remaining = Math.max(0, config.max - record.count)

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  }
}

// 设置速率限制响应头
export function setRateLimitHeaders(
  event: any,
  result: { remaining: number; resetTime: number },
  max: number,
): void {
  setResponseHeaders(event, {
    'X-RateLimit-Limit': max.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  })
}

// 创建速率限制中间件
export function defineRateLimit(config: RateLimitConfig) {
  return defineEventHandler(async (event) => {
    // 只对 GET/POST/PUT/DELETE 等请求进行限制
    const method = event.node.req.method
    if (!method || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return
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
}

// 预定义的速率限制配置
export const RateLimits = {
  // 通用 API：每分钟 60 次
  api: {
    windowMs: 60 * 1000,
    max: 60,
    message: 'API 请求过于频繁，请稍后再试',
  },

  // 认证相关：每分钟 10 次（防暴力破解）
  auth: {
    windowMs: 60 * 1000,
    max: 10,
    message: '登录尝试过于频繁，请稍后再试',
  },

  // 注册：每小时 3 次
  register: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: '注册过于频繁，请稍后再试',
  },

  // 密码重置：每小时 5 次
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: '密码重置请求过于频繁，请稍后再试',
  },

  // 文件上传：每分钟 10 次
  upload: {
    windowMs: 60 * 1000,
    max: 10,
    message: '上传过于频繁，请稍后再试',
  },

  // 评论：每分钟 5 次
  comment: {
    windowMs: 60 * 1000,
    max: 5,
    message: '评论过于频繁，请稍后再试',
  },

  // 搜索：每分钟 30 次
  search: {
    windowMs: 60 * 1000,
    max: 30,
    message: '搜索过于频繁，请稍后再试',
  },
}
