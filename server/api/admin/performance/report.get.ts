/**
 * 获取性能报告
 * GET /api/admin/performance/report
 */

import { getPerformanceReport } from '~/server/utils/performance-monitoring'

export default defineEventHandler(async (event) => {
  // 检查管理员权限
  const auth = event.context['auth']
  if (!auth || auth.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const query = getQuery(event)
  const period = (query.period as '1h' | '24h' | '7d' | '30d') || '24h'

  return await getPerformanceReport(period)
})
