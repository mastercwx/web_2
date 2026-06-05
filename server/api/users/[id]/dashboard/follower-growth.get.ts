import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const days = Number(query.days) || 30

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: '缺少用户ID',
    })
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 计算日期范围
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // 获取每日新增粉丝数
  const follows = await prisma.follow.findMany({
    where: {
      followingId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // 按日期分组统计
  const dailyCounts: Record<string, number> = {}

  // 初始化所有日期为 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0] || ''
    dailyCounts[dateStr] = 0
  }

  // 统计每日新增
  follows.forEach((follow) => {
    const dateStr = follow.createdAt.toISOString().split('T')[0] || ''
    if (dailyCounts[dateStr] !== undefined) {
      dailyCounts[dateStr]++
    }
  })

  // 转换为数组格式
  const growthData = Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
  }))

  // 计算累计粉丝数
  let cumulative = await prisma.follow.count({
    where: {
      followingId: userId,
      createdAt: { lt: startDate },
    },
  })

  const growthWithCumulative = growthData.map((item) => {
    cumulative += item.count
    return {
      ...item,
      cumulative,
    }
  })

  return {
    code: 200,
    data: {
      growth: growthWithCumulative,
      totalDays: days,
    },
  }
})
