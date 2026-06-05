/**
 * 获取资源使用情况
 * GET /api/admin/performance/resources
 */

import { getResourceUsage } from '~/server/utils/performance-monitoring'

export default defineEventHandler(async (event) => {
  // 检查管理员权限
  const auth = event.context['auth']
  if (!auth || auth.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  return getResourceUsage()
})
