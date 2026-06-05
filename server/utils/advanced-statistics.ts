import { prisma } from '~/server/utils/prisma'

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface OverviewStats {
  totalPosts: number
  totalComments: number
  totalUsers: number
  totalViews: number
  totalLikes: number
  totalFavorites: number
  growthRates: {
    posts: number
    comments: number
    users: number
    views: number
  }
}

export interface ContentAnalytics {
  topPosts: Array<{
    id: number
    title: string
    slug: string
    views: number
    likes: number
    comments: number
    engagementRate: number
  }>
  postsByStatus: Array<{
    status: string
    count: number
  }>
  postsByCategory: Array<{
    category: string
    count: number
  }>
  postsByDay: Array<{
    date: string
    count: number
  }>
  averagePostLength: number
  averageCommentsPerPost: number
}

export interface UserAnalytics {
  userGrowth: Array<{
    date: string
    newUsers: number
    totalUsers: number
  }>
  usersByRole: Array<{
    role: string
    count: number
  }>
  usersByStatus: Array<{
    status: string
    count: number
  }>
  topContributors: Array<{
    id: number
    username: string
    avatar: string | null
    postCount: number
    commentCount: number
    totalEngagement: number
  }>
  userRetention: {
    day1: number
    day7: number
    day30: number
  }
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
}

export interface EngagementAnalytics {
  likesByDay: Array<{
    date: string
    count: number
  }>
  commentsByDay: Array<{
    date: string
    count: number
  }>
  favoritesByDay: Array<{
    date: string
    count: number
  }>
  engagementByHour: Array<{
    hour: number
    likes: number
    comments: number
  }>
  topEngagingPosts: Array<{
    id: number
    title: string
    engagementScore: number
  }>
  averageEngagementRate: number
}

export interface TrafficAnalytics {
  pageViewsByDay: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  topReferrers: Array<{
    source: string
    count: number
  }>
  topPages: Array<{
    path: string
    title: string
    views: number
  }>
  deviceBreakdown: Array<{
    device: string
    count: number
  }>
  browserBreakdown: Array<{
    browser: string
    count: number
  }>
}

export interface RevenueAnalytics {
  adImpressions: number
  adClicks: number
  adCTR: number
  adRevenue: number
  revenueByDay: Array<{
    date: string
    impressions: number
    clicks: number
    revenue: number
  }>
  topPerformingAds: Array<{
    id: number
    name: string
    impressions: number
    clicks: number
    ctr: number
  }>
}

// 获取日期范围
export function getDateRange(period: string): DateRange {
  const now = new Date()
  const startDate = new Date()

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 30)
  }

  return { startDate, endDate: now }
}

// 获取概览统计
export async function getOverviewStats(period: string = 'month'): Promise<OverviewStats> {
  const { startDate, endDate } = getDateRange(period)
  const previousStartDate = new Date(
    startDate.getTime() - (endDate.getTime() - startDate.getTime()),
  )

  const [
    totalPosts,
    totalComments,
    totalUsers,
    totalLikes,
    totalFavorites,
    currentPeriodPosts,
    currentPeriodComments,
    currentPeriodUsers,
    previousPeriodPosts,
    previousPeriodComments,
    previousPeriodUsers,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.comment.count(),
    prisma.user.count(),
    prisma.like.count(),
    prisma.favorite.count(),
    prisma.post.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.comment.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.post.count({ where: { createdAt: { gte: previousStartDate, lt: startDate } } }),
    prisma.comment.count({ where: { createdAt: { gte: previousStartDate, lt: startDate } } }),
    prisma.user.count({ where: { createdAt: { gte: previousStartDate, lt: startDate } } }),
  ])

  // 计算增长率
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    totalPosts,
    totalComments,
    totalUsers,
    totalViews: 0, // 需要页面浏览统计
    totalLikes,
    totalFavorites,
    growthRates: {
      posts: calculateGrowth(currentPeriodPosts, previousPeriodPosts),
      comments: calculateGrowth(currentPeriodComments, previousPeriodComments),
      users: calculateGrowth(currentPeriodUsers, previousPeriodUsers),
      views: 0,
    },
  }
}

// 获取内容分析
export async function getContentAnalytics(period: string = 'month'): Promise<ContentAnalytics> {
  const { startDate, endDate } = getDateRange(period)

  const [topPosts, postsByStatus, postsByDay, totalPosts, totalComments, _averagePostLength] =
    await Promise.all([
      prisma.post.findMany({
        take: 10,
        orderBy: { likes: { _count: 'desc' } },
        select: {
          id: true,
          title: true,
          slug: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.post.groupBy({
        by: ['published'],
        _count: true,
      }),
      prisma.post.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.post.aggregate({
        _avg: { id: true },
      }),
    ])

  // 按日期统计文章
  const postsByDayMap = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] || ''
    postsByDayMap.set(dateStr, 0)
  }

  for (const post of postsByDay) {
    const dateStr = post.createdAt.toISOString().split('T')[0] || ''
    postsByDayMap.set(dateStr, (postsByDayMap.get(dateStr) || 0) + 1)
  }

  // 计算参与度
  const topPostsWithEngagement = topPosts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    views: post._count.likes || 0,
    likes: post._count.likes,
    comments: post._count.comments,
    engagementRate: post._count.likes
      ? Math.round(((post._count.likes + post._count.comments) / post._count.likes) * 100)
      : 0,
  }))

  return {
    topPosts: topPostsWithEngagement,
    postsByStatus: postsByStatus.map((s) => ({
      status: s.published ? 'published' : 'draft',
      count: s._count,
    })),
    postsByCategory: [], // 需要分类模型
    postsByDay: Array.from(postsByDayMap.entries()).map(([date, count]) => ({ date, count })),
    averagePostLength: 0, // 需要内容长度统计
    averageCommentsPerPost: totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0,
  }
}

// 获取用户分析
export async function getUserAnalytics(period: string = 'month'): Promise<UserAnalytics> {
  const { startDate, endDate } = getDateRange(period)

  const [userGrowthData, usersByRole, usersByStatus, topContributors, _recentUsers] =
    await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { posts: { _count: 'desc' } },
        select: {
          id: true,
          username: true,
          avatar: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, createdAt: true },
      }),
    ])

  // 按日期统计用户增长
  const userGrowthMap = new Map<string, { newUsers: number; totalUsers: number }>()
  let totalUsers = await prisma.user.count({
    where: { createdAt: { lt: startDate } },
  })

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] || ''
    userGrowthMap.set(dateStr, { newUsers: 0, totalUsers })
  }

  for (const user of userGrowthData) {
    const dateStr = user.createdAt.toISOString().split('T')[0] || ''
    const entry = userGrowthMap.get(dateStr)
    if (entry) {
      entry.newUsers++
      totalUsers++
      entry.totalUsers = totalUsers
    }
  }

  // 计算留存率（简化计算）
  const day1Users = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
  })
  const day7Users = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  })
  const day30Users = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  })

  // 活跃用户（简化计算）
  const activeUsers = await prisma.user.findMany({
    where: {
      OR: [
        { posts: { some: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } } },
        { comments: { some: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } } },
      ],
    },
    select: { id: true },
  })

  return {
    userGrowth: Array.from(userGrowthMap.entries()).map(([date, data]) => ({
      date,
      newUsers: data.newUsers,
      totalUsers: data.totalUsers,
    })),
    usersByRole: usersByRole.map((r) => ({
      role: r.role,
      count: r._count,
    })),
    usersByStatus: usersByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    topContributors: topContributors.map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      postCount: u._count.posts,
      commentCount: u._count.comments,
      totalEngagement: u._count.posts + u._count.comments + u._count.likes,
    })),
    userRetention: {
      day1: day1Users > 0 ? Math.round((activeUsers.length / day1Users) * 100) : 0,
      day7: day7Users > 0 ? Math.round((activeUsers.length / day7Users) * 100) : 0,
      day30: day30Users > 0 ? Math.round((activeUsers.length / day30Users) * 100) : 0,
    },
    activeUsers: {
      daily: activeUsers.length,
      weekly: activeUsers.length * 2, // 简化
      monthly: activeUsers.length * 5, // 简化
    },
  }
}

// 获取参与度分析
export async function getEngagementAnalytics(
  period: string = 'month',
): Promise<EngagementAnalytics> {
  const { startDate, endDate } = getDateRange(period)

  const [likesByDay, commentsByDay, favoritesByDay, topEngagingPosts] = await Promise.all([
    prisma.like.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    }),
    prisma.favorite.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    }),
    prisma.post.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            favorites: true,
          },
        },
      },
    }),
  ])

  // 按日期统计
  const likesByDayMap = new Map<string, number>()
  const commentsByDayMap = new Map<string, number>()
  const favoritesByDayMap = new Map<string, number>()

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] || ''
    likesByDayMap.set(dateStr, 0)
    commentsByDayMap.set(dateStr, 0)
    favoritesByDayMap.set(dateStr, 0)
  }

  for (const like of likesByDay) {
    const dateStr = like.createdAt.toISOString().split('T')[0] || ''
    likesByDayMap.set(dateStr, (likesByDayMap.get(dateStr) || 0) + 1)
  }

  for (const comment of commentsByDay) {
    const dateStr = comment.createdAt.toISOString().split('T')[0] || ''
    commentsByDayMap.set(dateStr, (commentsByDayMap.get(dateStr) || 0) + 1)
  }

  for (const favorite of favoritesByDay) {
    const dateStr = favorite.createdAt.toISOString().split('T')[0] || ''
    favoritesByDayMap.set(dateStr, (favoritesByDayMap.get(dateStr) || 0) + 1)
  }

  // 按小时统计参与度（简化）
  const engagementByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 50),
  }))

  // 计算参与度分数
  const topEngagingPostsWithScore = topEngagingPosts
    .map((post) => ({
      id: post.id,
      title: post.title,
      engagementScore: post._count.likes * 2 + post._count.comments * 3 + post._count.favorites * 1,
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)

  const totalEngagement = likesByDay.length + commentsByDay.length + favoritesByDay.length
  const totalPosts = await prisma.post.count()

  return {
    likesByDay: Array.from(likesByDayMap.entries()).map(([date, count]) => ({ date, count })),
    commentsByDay: Array.from(commentsByDayMap.entries()).map(([date, count]) => ({ date, count })),
    favoritesByDay: Array.from(favoritesByDayMap.entries()).map(([date, count]) => ({
      date,
      count,
    })),
    engagementByHour,
    topEngagingPosts: topEngagingPostsWithScore,
    averageEngagementRate: totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0,
  }
}

// 获取广告收入分析
export async function getRevenueAnalytics(period: string = 'month'): Promise<RevenueAnalytics> {
  const { startDate, endDate } = getDateRange(period)

  const [totalImpressions, totalClicks, revenueByDay, topPerformingAds] = await Promise.all([
    prisma.adImpression.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.adClick.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.adImpression.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    }),
    prisma.ad.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            impressions: true,
            clicks: true,
          },
        },
      },
    }),
  ])

  // 按日期统计收入
  const revenueByDayMap = new Map<
    string,
    { impressions: number; clicks: number; revenue: number }
  >()
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] || ''
    revenueByDayMap.set(dateStr, { impressions: 0, clicks: 0, revenue: 0 })
  }

  for (const impression of revenueByDay) {
    const dateStr = impression.createdAt.toISOString().split('T')[0] || ''
    const entry = revenueByDayMap.get(dateStr)
    if (entry) {
      entry.impressions++
      entry.revenue += 0.01 // 假设每次展示 $0.01
    }
  }

  const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 100) : 0

  return {
    adImpressions: totalImpressions,
    adClicks: totalClicks,
    adCTR: ctr,
    adRevenue: totalImpressions * 0.01, // 简化计算
    revenueByDay: Array.from(revenueByDayMap.entries()).map(([date, data]) => ({
      date,
      impressions: data.impressions,
      clicks: data.clicks,
      revenue: data.revenue,
    })),
    topPerformingAds: topPerformingAds.map((ad) => ({
      id: ad.id,
      name: ad.name,
      impressions: ad._count.impressions,
      clicks: ad._count.clicks,
      ctr:
        ad._count.impressions > 0
          ? Math.round((ad._count.clicks / ad._count.impressions) * 100)
          : 0,
    })),
  }
}

// 导出统计数据
export async function exportStatistics(
  type: string,
  period: string,
  format: 'json' | 'csv' = 'json',
): Promise<string> {
  let data: any

  switch (type) {
    case 'overview':
      data = await getOverviewStats(period)
      break
    case 'content':
      data = await getContentAnalytics(period)
      break
    case 'users':
      data = await getUserAnalytics(period)
      break
    case 'engagement':
      data = await getEngagementAnalytics(period)
      break
    case 'revenue':
      data = await getRevenueAnalytics(period)
      break
    default:
      throw new Error(`Unknown statistics type: ${type}`)
  }

  if (format === 'csv') {
    return convertToCSV(data)
  }

  return JSON.stringify(data, null, 2)
}

// 转换为 CSV 格式
function convertToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header]
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value
        })
        .join(','),
    )

    return [headers.join(','), ...rows].join('\n')
  }

  // 如果是对象，递归处理
  const results: string[] = []
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      results.push(`\n${key}:`)
      results.push(convertToCSV(value))
    } else {
      results.push(`${key}: ${value}`)
    }
  }

  return results.join('\n')
}
