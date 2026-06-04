import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/moderation/comments
 * 获取待审核评论列表（管理员）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '没有权限' })
  }

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const status = (query.status as string) || 'PENDING'

  const where = {
    status: status as any,
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ])

  return {
    data: {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
