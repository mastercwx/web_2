import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  const query = getQuery(event)
  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10

  if (!name) {
    throw createError({
      statusCode: 400,
      message: '缺少标签名称',
    })
  }

  const skip = (page - 1) * pageSize

  // 查找标签
  const tag = await prisma.tag.findUnique({
    where: { name },
  })

  if (!tag) {
    throw createError({
      statusCode: 404,
      message: '标签不存在',
    })
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        tags: {
          some: {
            name,
          },
        },
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
        published: true,
        tags: {
          some: {
            name,
          },
        },
      },
    }),
  ])

  return {
    tag: {
      id: tag.id,
      name: tag.name,
    },
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
