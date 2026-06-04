import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  // 从中间件获取用户信息
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '未登录',
    })
  }

  // 查询用户详细信息
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
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
    data: { user },
  }
})
