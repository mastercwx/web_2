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
  const days = Number(query.days) || 7

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // 按操作类型统计
  const actionStats = await prisma.activityLog.groupBy({
    by: ['action'],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  })

  // 每日活动数量
  const dailyLogs = (await prisma.$queryRaw`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM activity_logs
    WHERE created_at >= ${startDate}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `) as { date: Date; count: bigint }[]

  // 最活跃用户
  const activeUsers = await prisma.activityLog.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startDate,
      },
      userId: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  })

  // 获取用户信息
  const userIds = activeUsers.map((u) => u.userId).filter((id): id is number => id !== null)
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      username: true,
      avatar: true,
    },
  })

  const usersMap = new Map(users.map((u) => [u.id, u]))

  // 最近24小时活动
  const last24Hours = new Date()
  last24Hours.setHours(last24Hours.getHours() - 24)

  const recentActivityCount = await prisma.activityLog.count({
    where: {
      createdAt: {
        gte: last24Hours,
      },
    },
  })

  return {
    actionStats: actionStats.map((s) => ({
      action: s.action,
      count: s._count.id,
    })),
    dailyActivity: dailyLogs.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    activeUsers: activeUsers.map((u) => ({
      ...u,
      _count: { id: u._count.id },
      user: u.userId ? usersMap.get(u.userId) : null,
    })),
    recentActivityCount,
  }
})
