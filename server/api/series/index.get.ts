import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/series
 * 获取文章系列列表
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 12
  const authorId = query.authorId ? Number(query.authorId) : undefined

  const where = {
    ...(authorId ? { authorId } : {}),
  }

  const [series, total] = await Promise.all([
    prisma.series.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.series.count({ where }),
  ])

  return {
    data: {
      series,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
