import { getUserAnalytics } from '~/server/utils/advanced-statistics'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = (query['period'] as string) || 'month'

  const stats = await getUserAnalytics(period)

  return {
    code: 200,
    data: stats,
  }
})
