import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const query = getQuery(event)

  const page = Number(query.page) || 1
  const limit = Math.min(Number(query.limit) || 20, 100)
  const skip = (page - 1) * limit

  // 筛选条件
  const where: any = {}

  if (query.userId) {
    where.userId = Number(query.userId)
  }

  if (query.action) {
    where.action = query.action as string
  }

  if (query.entity) {
    where.entity = query.entity as string
  }

  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) {
      where.createdAt.gte = new Date(query.startDate as string)
    }
    if (query.endDate) {
      where.createdAt.lte = new Date(query.endDate as string)
    }
  }

  if (query.search) {
    where.OR = [
      { details: { contains: query.search as string } },
      { ipAddress: { contains: query.search as string } },
    ]
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
})
