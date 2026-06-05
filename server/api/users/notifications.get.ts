import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      emailNotifications: true,
      emailVerified: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  return {
    code: 200,
    data: {
      emailNotifications: user.emailNotifications,
      emailVerified: user.emailVerified,
    },
  }
})
