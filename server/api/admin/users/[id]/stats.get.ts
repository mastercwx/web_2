import { getUserActivityStats } from '~/server/utils/user-management'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid user ID',
    })
  }

  const stats = await getUserActivityStats(id)

  return {
    code: 200,
    data: stats,
  }
})
