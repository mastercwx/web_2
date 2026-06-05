/**
 * 获取实时性能指标
 * GET /api/admin/performance/metrics
 */

import { getRealtimeMetrics } from '~/server/utils/performance-monitoring'

export default defineEventHandler(async (event) => {
  // 检查管理员权限
  const auth = event.context['auth']
  if (!auth || auth.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  return await getRealtimeMetrics()
})
