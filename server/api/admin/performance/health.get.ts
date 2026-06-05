/**
 * 获取系统健康状态
 * GET /api/admin/performance/health
 */

import { getSystemHealth } from '~/server/utils/performance-monitoring'

export default defineEventHandler(async (event) => {
  // 检查管理员权限
  const auth = event.context['auth']
  if (!auth || auth.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  return await getSystemHealth()
})
