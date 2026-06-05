import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const accounts = await prisma.oAuthAccount.findMany({
    where: {
      userId: auth.userId,
    },
    select: {
      id: true,
      provider: true,
      providerId: true,
      createdAt: true,
    },
  })

  return {
    code: 200,
    data: {
      accounts,
    },
  }
})
