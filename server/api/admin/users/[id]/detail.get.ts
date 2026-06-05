import { getUserDetailed } from '~/server/utils/user-management'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid user ID',
    })
  }

  const user = await getUserDetailed(id)

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  return {
    code: 200,
    data: user,
  }
})
