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

  if (!body.avatar) {
    throw createError({
      statusCode: 400,
      message: '请提供头像 URL',
    })
  }

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { avatar: body.avatar },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      role: true,
    },
  })

  return {
    code: 200,
    message: '头像更新成功',
    data: { user },
  }
})
