import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10

  if (!id || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: '无效的用户ID',
    })
  }

  // 只能查看自己的收藏
  if (auth.userId !== id) {
    throw createError({
      statusCode: 403,
      message: '无权查看其他用户的收藏',
    })
  }

  const skip = (page - 1) * pageSize

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: id },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            tags: true,
            _count: {
              select: {
                comments: true,
                likes: true,
                favorites: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.favorite.count({
      where: { userId: id },
    }),
  ])

  return {
    favorites: favorites.map((f) => f.post),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
