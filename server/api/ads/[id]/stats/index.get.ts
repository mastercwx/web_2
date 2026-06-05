import { getAdStats, getAdDailyStats } from '~/server/utils/ads'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: '无效的广告 ID',
    })
  }

  const query = getQuery(event)
  const days = Number(query.days) || 30

  const [stats, dailyStats] = await Promise.all([getAdStats(id), getAdDailyStats(id, days)])

  return {
    data: {
      ...stats,
      daily: dailyStats,
    },
  }
})
