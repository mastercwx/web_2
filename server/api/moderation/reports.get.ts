import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/moderation/reports
 * 获取举报列表（管理员）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '没有权限' })
  }

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const status = (query.status as string) || 'pending'

  const where = {
    status,
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
        comment: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ])

  return {
    data: {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
