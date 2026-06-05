/**
 * 获取性能告警
 * GET /api/admin/performance/alerts
 */

import { getAlertConfigs, checkAlerts } from '~/server/utils/performance-monitoring'

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
  const check = query.check === 'true'

  if (check) {
    return await checkAlerts()
  }

  return getAlertConfigs()
})
