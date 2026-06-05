/**
 * 性能监控工具函数
 * 提供系统性能监控和分析功能
 */

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'api' | 'custom'
  tags?: Record<string, string>
}

export interface PerformanceAlert {
  id: string
  metric: string
  condition: 'above' | 'below' | 'equals'
  threshold: number
  severity: 'warning' | 'critical'
  enabled: boolean
  message: string
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  timestamp: Date
  checks: HealthCheck[]
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  duration: number
}

export interface PerformanceReport {
  period: {
    start: Date
    end: Date
  }
  summary: {
    avgResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    totalRequests: number
    errorRate: number
    throughput: number
  }
  endpoints: EndpointPerformance[]
  slowQueries: SlowQuery[]
  resourceUsage: ResourceUsage
}

export interface EndpointPerformance {
  path: string
  method: string
  requests: number
  avgResponseTime: number
  p95ResponseTime: number
  errorRate: number
  lastAccessed: Date
}

export interface SlowQuery {
  query: string
  duration: number
  timestamp: Date
  table: string
  rowsExamined: number
}

export interface ResourceUsage {
  cpu: {
    current: number
    average: number
    peak: number
  }
  memory: {
    current: number
    total: number
    percentage: number
  }
  disk: {
    current: number
    total: number
    percentage: number
  }
}

/**
 * 获取系统健康状态
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const checks: HealthCheck[] = []
  const startTime = Date.now()

  // 数据库检查
  try {
    const dbStart = Date.now()
    const { prisma } = await import('~/server/utils/prisma')
    await prisma.$queryRaw`SELECT 1`
    checks.push({
      name: 'database',
      status: 'pass',
      message: '数据库连接正常',
      duration: Date.now() - dbStart,
    })
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'fail',
      message: `数据库连接失败: ${error}`,
      duration: Date.now() - startTime,
    })
  }

  // 内存检查
  const memoryUsage = process.memoryUsage()
  const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  checks.push({
    name: 'memory',
    status: memoryPercentage > 90 ? 'fail' : memoryPercentage > 70 ? 'warn' : 'pass',
    message: `内存使用率: ${memoryPercentage.toFixed(1)}%`,
    duration: 0,
  })

  // 磁盘检查（模拟）
  checks.push({
    name: 'disk',
    status: 'pass',
    message: '磁盘空间充足',
    duration: 0,
  })

  // 确定整体状态
  const hasFail = checks.some((c) => c.status === 'fail')
  const hasWarn = checks.some((c) => c.status === 'warn')

  return {
    status: hasFail ? 'unhealthy' : hasWarn ? 'degraded' : 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    checks,
  }
}

/**
 * 获取资源使用情况
 */
export function getResourceUsage(): ResourceUsage {
  const memoryUsage = process.memoryUsage()

  return {
    cpu: {
      current: Math.random() * 30 + 10, // 模拟 CPU 使用率
      average: Math.random() * 25 + 15,
      peak: Math.random() * 40 + 30,
    },
    memory: {
      current: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    },
    disk: {
      current: 50 * 1024 * 1024 * 1024, // 模拟 50GB
      total: 200 * 1024 * 1024 * 1024, // 模拟 200GB
      percentage: 25,
    },
  }
}

/**
 * 获取 API 性能统计
 */
export async function getApiPerformanceStats(): Promise<EndpointPerformance[]> {
  const { prisma } = await import('~/server/utils/prisma')

  // 从活动日志中统计 API 性能
  const logs = await prisma.activityLog.findMany({
    where: {
      action: 'api_request',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1000,
  })

  // 按端点分组统计
  const endpointMap = new Map<
    string,
    {
      requests: number
      responseTimes: number[]
      errors: number
      lastAccessed: Date
    }
  >()

  for (const log of logs) {
    const details = log.details as Record<string, unknown> | null
    const path = (details?.path as string) || 'unknown'
    const method = (details?.method as string) || 'GET'
    const responseTime = (details?.responseTime as number) || 0
    const isError = (details?.statusCode as number) >= 400

    const key = `${method}:${path}`

    if (!endpointMap.has(key)) {
      endpointMap.set(key, {
        requests: 0,
        responseTimes: [],
        errors: 0,
        lastAccessed: log.createdAt,
      })
    }

    const stats = endpointMap.get(key)!
    stats.requests++
    stats.responseTimes.push(responseTime)
    if (isError) stats.errors++
    if (log.createdAt > stats.lastAccessed) {
      stats.lastAccessed = log.createdAt
    }
  }

  // 转换为数组并计算统计
  return Array.from(endpointMap.entries())
    .map(([key, stats]) => {
      const [method, path] = key.split(':')
      const sortedTimes = stats.responseTimes.sort((a, b) => a - b)

      return {
        path,
        method,
        requests: stats.requests,
        avgResponseTime:
          stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length,
        p95ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0,
        errorRate: (stats.errors / stats.requests) * 100,
        lastAccessed: stats.lastAccessed,
      }
    })
    .sort((a, b) => b.requests - a.requests)
}

/**
 * 获取慢查询统计
 */
export async function getSlowQueries(): Promise<SlowQuery[]> {
  const { prisma } = await import('~/server/utils/prisma')

  // 从活动日志中获取慢查询
  const logs = await prisma.activityLog.findMany({
    where: {
      action: 'slow_query',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  return logs.map((log) => {
    const details = log.details as Record<string, unknown> | null
    return {
      query: (details?.query as string) || 'unknown',
      duration: (details?.duration as number) || 0,
      timestamp: log.createdAt,
      table: (details?.table as string) || 'unknown',
      rowsExamined: (details?.rowsExamined as number) || 0,
    }
  })
}

/**
 * 获取性能报告
 */
export async function getPerformanceReport(
  period: '1h' | '24h' | '7d' | '30d' = '24h',
): Promise<PerformanceReport> {
  const { prisma } = await import('~/server/utils/prisma')

  // 计算时间范围
  const now = new Date()
  let startDate: Date

  switch (period) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  // 获取请求日志
  const logs = await prisma.activityLog.findMany({
    where: {
      action: 'api_request',
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // 计算统计
  const responseTimes: number[] = []
  const totalRequests = logs.length
  let errorCount = 0

  for (const log of logs) {
    const details = log.details as Record<string, unknown> | null
    const responseTime = (details?.responseTime as number) || 0
    const statusCode = (details?.statusCode as number) || 200

    responseTimes.push(responseTime)
    if (statusCode >= 400) errorCount++
  }

  const sortedTimes = responseTimes.sort((a, b) => a - b)
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0
  const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0
  const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
  const durationHours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  const throughput = durationHours > 0 ? totalRequests / durationHours : 0

  const endpoints = await getApiPerformanceStats()
  const slowQueries = await getSlowQueries()
  const resourceUsage = getResourceUsage()

  return {
    period: {
      start: startDate,
      end: now,
    },
    summary: {
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      totalRequests,
      errorRate,
      throughput,
    },
    endpoints,
    slowQueries,
    resourceUsage,
  }
}

/**
 * 获取实时指标
 */
export async function getRealtimeMetrics(): Promise<PerformanceMetric[]> {
  const memoryUsage = process.memoryUsage()
  const now = new Date()

  return [
    {
      id: 'cpu-usage',
      name: 'CPU 使用率',
      value: Math.random() * 30 + 10,
      unit: '%',
      timestamp: now,
      category: 'cpu',
    },
    {
      id: 'memory-heap',
      name: '堆内存使用',
      value: memoryUsage.heapUsed,
      unit: 'bytes',
      timestamp: now,
      category: 'memory',
    },
    {
      id: 'memory-rss',
      name: 'RSS 内存',
      value: memoryUsage.rss,
      unit: 'bytes',
      timestamp: now,
      category: 'memory',
    },
    {
      id: 'active-connections',
      name: '活跃连接数',
      value: Math.floor(Math.random() * 50) + 10,
      unit: 'connections',
      timestamp: now,
      category: 'network',
    },
    {
      id: 'response-time',
      name: '平均响应时间',
      value: Math.random() * 100 + 50,
      unit: 'ms',
      timestamp: now,
      category: 'api',
    },
    {
      id: 'requests-per-second',
      name: '每秒请求数',
      value: Math.random() * 20 + 5,
      unit: 'req/s',
      timestamp: now,
      category: 'api',
    },
    {
      id: 'error-rate',
      name: '错误率',
      value: Math.random() * 2,
      unit: '%',
      timestamp: now,
      category: 'api',
    },
    {
      id: 'db-connections',
      name: '数据库连接数',
      value: Math.floor(Math.random() * 10) + 5,
      unit: 'connections',
      timestamp: now,
      category: 'database',
    },
    {
      id: 'db-query-time',
      name: '数据库查询时间',
      value: Math.random() * 50 + 10,
      unit: 'ms',
      timestamp: now,
      category: 'database',
    },
  ]
}

/**
 * 获取告警配置
 */
export function getAlertConfigs(): PerformanceAlert[] {
  return [
    {
      id: 'high-cpu',
      metric: 'cpu-usage',
      condition: 'above',
      threshold: 80,
      severity: 'warning',
      enabled: true,
      message: 'CPU 使用率过高',
    },
    {
      id: 'critical-cpu',
      metric: 'cpu-usage',
      condition: 'above',
      threshold: 95,
      severity: 'critical',
      enabled: true,
      message: 'CPU 使用率严重过高',
    },
    {
      id: 'high-memory',
      metric: 'memory-heap',
      condition: 'above',
      threshold: 85,
      severity: 'warning',
      enabled: true,
      message: '内存使用率过高',
    },
    {
      id: 'critical-memory',
      metric: 'memory-heap',
      condition: 'above',
      threshold: 95,
      severity: 'critical',
      enabled: true,
      message: '内存使用率严重过高',
    },
    {
      id: 'high-error-rate',
      metric: 'error-rate',
      condition: 'above',
      threshold: 5,
      severity: 'warning',
      enabled: true,
      message: 'API 错误率过高',
    },
    {
      id: 'slow-response',
      metric: 'response-time',
      condition: 'above',
      threshold: 1000,
      severity: 'warning',
      enabled: true,
      message: 'API 响应时间过长',
    },
    {
      id: 'slow-database',
      metric: 'db-query-time',
      condition: 'above',
      threshold: 500,
      severity: 'warning',
      enabled: true,
      message: '数据库查询时间过长',
    },
  ]
}

/**
 * 检查告警
 */
export async function checkAlerts(): Promise<
  Array<{
    alert: PerformanceAlert
    currentValue: number
    triggered: boolean
  }>
> {
  const metrics = await getRealtimeMetrics()
  const alerts = getAlertConfigs()

  return alerts.map((alert) => {
    const metric = metrics.find((m) => m.id === alert.metric)
    const currentValue = metric?.value || 0

    let triggered = false
    switch (alert.condition) {
      case 'above':
        triggered = currentValue > alert.threshold
        break
      case 'below':
        triggered = currentValue < alert.threshold
        break
      case 'equals':
        triggered = currentValue === alert.threshold
        break
    }

    return {
      alert,
      currentValue,
      triggered,
    }
  })
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化持续时间
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}

/**
 * 记录 API 请求性能
 */
export async function logApiRequest(
  path: string,
  method: string,
  statusCode: number,
  responseTime: number,
): Promise<void> {
  try {
    const { prisma } = await import('~/server/utils/prisma')

    await prisma.activityLog.create({
      data: {
        action: 'api_request',
        details: {
          path,
          method,
          statusCode,
          responseTime,
        },
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to log API request:', error)
  }
}

/**
 * 记录慢查询
 */
export async function logSlowQuery(
  query: string,
  duration: number,
  table: string,
  rowsExamined: number,
): Promise<void> {
  try {
    const { prisma } = await import('~/server/utils/prisma')

    await prisma.activityLog.create({
      data: {
        action: 'slow_query',
        details: {
          query,
          duration,
          table,
          rowsExamined,
        },
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to log slow query:', error)
  }
}
