import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权访问' })
  }

  // 获取总统计数据
  const [totalPosts, publishedPosts, totalComments, totalUsers, totalTags] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.comment.count(),
    prisma.user.count(),
    prisma.tag.count(),
  ])

  // 获取今日新增
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayPosts, todayComments, todayUsers] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: today } } }),
    prisma.comment.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
  ])

  // 获取草稿数
  const draftPosts = await prisma.post.count({
    where: { published: false },
  })

  // 获取最近7天每天的文章数
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentPosts = await prisma.post.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  })

  const postsByDay: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0] as string
    postsByDay[key] = 0
  }

  recentPosts.forEach((post: { createdAt: Date }) => {
    const key = post.createdAt.toISOString().split('T')[0] as string
    if (key in postsByDay) {
      postsByDay[key] = (postsByDay[key] || 0) + 1
    }
  })

  // 获取最近7天每天的评论数
  const recentComments = await prisma.comment.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  })

  const commentsByDay: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0] as string
    commentsByDay[key] = 0
  }

  recentComments.forEach((comment: { createdAt: Date }) => {
    const key = comment.createdAt.toISOString().split('T')[0] as string
    if (key in commentsByDay) {
      commentsByDay[key] = (commentsByDay[key] || 0) + 1
    }
  })

  return {
    total: {
      posts: totalPosts,
      publishedPosts,
      draftPosts,
      comments: totalComments,
      users: totalUsers,
      tags: totalTags,
    },
    today: {
      posts: todayPosts,
      comments: todayComments,
      users: todayUsers,
    },
    trend: {
      postsByDay: Object.entries(postsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      commentsByDay: Object.entries(commentsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    },
  }
})
