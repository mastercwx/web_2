import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/users/:id/reading-history
 * 获取用户阅读历史（仅自己可查看）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const userId = Number(event.context.params?.['id'])
  if (!userId) {
    throw createError({ statusCode: 400, message: '无效的用户ID' })
  }

  // 只能查看自己的阅读历史
  if (auth.userId !== userId && auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权查看他人阅读历史' })
  }

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20

  const skip = (page - 1) * pageSize

  const [history, total] = await Promise.all([
    prisma.readingHistory.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        },
      },
      orderBy: { readAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.readingHistory.count({
      where: { userId },
    }),
  ])

  // 截断文章内容作为摘要
  const items = history.map((item) => ({
    ...item,
    post: {
      ...item.post,
      excerpt: item.post.content.substring(0, 200) + (item.post.content.length > 200 ? '...' : ''),
    },
  }))

  return {
    history: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
