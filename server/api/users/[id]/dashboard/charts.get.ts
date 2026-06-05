/**
 * 获取图表数据 API
 * GET /api/users/:id/dashboard/charts
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth?.userId) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const userId = Number(getRouterParam(event, 'id'))

  // 验证权限
  if (auth.userId !== userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '无权访问',
    })
  }

  const query = getQuery(event)
  const days = Math.min(Number(query.days) || 30, 365)

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  // 获取每日文章发布数据
  const dailyPosts = await prisma.post.groupBy({
    by: ['createdAt'],
    where: {
      authorId: userId,
      createdAt: { gte: cutoffDate },
    },
    _count: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  // 获取每日评论数据
  const dailyComments = await prisma.comment.groupBy({
    by: ['createdAt'],
    where: {
      authorId: userId,
      createdAt: { gte: cutoffDate },
    },
    _count: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  // 获取每日点赞数据
  const dailyLikes = await prisma.like.groupBy({
    by: ['createdAt'],
    where: {
      userId: userId,
      createdAt: { gte: cutoffDate },
    },
    _count: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  // 获取每日粉丝增长数据
  const dailyFollowers = await prisma.follow.groupBy({
    by: ['createdAt'],
    where: {
      followingId: userId,
      createdAt: { gte: cutoffDate },
    },
    _count: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  // 获取标签分布
  const tagDistribution = await prisma.post.findMany({
    where: {
      authorId: userId,
      published: true,
    },
    include: {
      tags: true,
    },
  })

  // 统计标签数量
  const tagCounts = new Map<string, number>()
  tagDistribution.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1)
    })
  })

  // 获取文章状态分布
  const postStatusDistribution = await prisma.post.groupBy({
    by: ['published'],
    where: {
      authorId: userId,
    },
    _count: { id: true },
  })

  // 生成日期序列
  const dateSeries: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dateSeries.push(date.toISOString().split('T')[0])
  }

  // 按日期聚合数据
  function aggregateByDate(data: any[], dateField: string = 'createdAt') {
    const aggregated = new Map<string, number>()
    data.forEach((item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0]
      aggregated.set(date, (aggregated.get(date) || 0) + item._count.id)
    })
    return dateSeries.map((date) => aggregated.get(date) || 0)
  }

  // 格式化标签分布数据
  const tagData = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))

  // 格式化文章状态分布数据
  const statusData = postStatusDistribution.map((item) => ({
    name: item.published ? '已发布' : '草稿',
    value: item._count.id,
  }))

  return {
    success: true,
    data: {
      daily: {
        dates: dateSeries,
        posts: aggregateByDate(dailyPosts),
        comments: aggregateByDate(dailyComments),
        likes: aggregateByDate(dailyLikes),
        followers: aggregateByDate(dailyFollowers),
      },
      tags: tagData,
      status: statusData,
    },
  }
})
