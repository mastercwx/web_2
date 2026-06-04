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

  const body = await readBody(event)

  // 更新通知设置
  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      emailNotifications: body.emailNotifications ?? undefined,
    },
    select: {
      emailNotifications: true,
    },
  })

  return {
    code: 200,
    message: '通知设置已更新',
    data: user,
  }
})
