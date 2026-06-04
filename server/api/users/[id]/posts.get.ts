import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
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

  const skip = (page - 1) * pageSize

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        authorId: id,
        published: true,
      },
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.post.count({
      where: {
        authorId: id,
        published: true,
      },
    }),
  ])

  return {
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
