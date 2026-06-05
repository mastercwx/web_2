import { getUserStatsOverview } from '~/server/utils/user-management'

export default defineEventHandler(async (_event) => {
  const stats = await getUserStatsOverview()

  return {
    code: 200,
    data: stats,
  }
})
