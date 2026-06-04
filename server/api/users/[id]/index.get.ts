import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: '无效的用户ID',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true,
          favorites: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  return user
})
