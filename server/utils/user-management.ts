import { prisma } from '~/server/utils/prisma'

export interface UserFilter {
  search?: string
  role?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  minPosts?: number
  maxPosts?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BulkOperationResult {
  success: number
  failed: number
  errors: string[]
}

export interface UserActivityStats {
  totalPosts: number
  totalComments: number
  totalLikes: number
  totalFavorites: number
  totalFollowers: number
  totalFollowing: number
  postsThisMonth: number
  commentsThisMonth: number
  lastActiveAt: Date | null
  joinDate: Date
  accountAge: number
  averagePostsPerMonth: number
}

export interface UserDetailed {
  id: number
  username: string
  email: string
  role: string
  status: string
  avatar: string | null
  bio: string | null
  createdAt: Date
  updatedAt: Date
  emailVerified: boolean
  twoFactorEnabled: boolean
  oauthProvider: string | null
  _count: {
    posts: number
    comments: number
    likes: number
    favorites: number
    followers: number
    following: number
    readingHistory: number
    notifications: number
  }
  recentPosts: Array<{
    id: number
    title: string
    createdAt: Date
    status: string
  }>
  recentActivity: Array<{
    id: number
    action: string
    createdAt: Date
    details: string | null
  }>
}

// 获取用户列表（高级筛选）
export async function getUsersWithAdvancedFilter(
  filter: UserFilter,
  page: number = 1,
  pageSize: number = 20,
) {
  const where: any = {}

  // 基础搜索
  if (filter.search) {
    where.OR = [
      { username: { contains: filter.search } },
      { email: { contains: filter.search } },
      { bio: { contains: filter.search } },
    ]
  }

  // 角色筛选
  if (filter.role && filter.role !== 'ALL') {
    where.role = filter.role
  }

  // 状态筛选
  if (filter.status && filter.status !== 'ALL') {
    where.status = filter.status
  }

  // 注册日期范围
  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {}
    if (filter.dateFrom) {
      where.createdAt.gte = new Date(filter.dateFrom)
    }
    if (filter.dateTo) {
      where.createdAt.lte = new Date(filter.dateTo + 'T23:59:59.999Z')
    }
  }

  // 文章数量筛选
  if (filter.minPosts !== undefined || filter.maxPosts !== undefined) {
    where.posts = {
      some: {},
    }
  }

  // 排序
  const orderBy: any = {}
  const sortBy = filter.sortBy || 'createdAt'
  const sortOrder = filter.sortOrder || 'desc'

  if (sortBy === 'posts') {
    orderBy.posts = { _count: sortOrder }
  } else if (sortBy === 'username') {
    orderBy.username = sortOrder
  } else if (sortBy === 'email') {
    orderBy.email = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        oauthProvider: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
            favorites: true,
            followers: true,
            following: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// 获取用户详细信息
export async function getUserDetailed(userId: number): Promise<UserDetailed | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
      emailVerified: true,
      twoFactorEnabled: true,
      oauthProvider: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true,
          favorites: true,
          followers: true,
          following: true,
          readingHistory: true,
          notifications: true,
        },
      },
    },
  })

  if (!user) return null

  // 获取最近文章
  const recentPosts = await prisma.post.findMany({
    where: { authorId: userId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
    },
  })

  // 获取最近活动
  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: userId },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      createdAt: true,
      details: true,
    },
  })

  return {
    ...user,
    recentPosts,
    recentActivity,
  }
}

// 获取用户活动统计
export async function getUserActivityStats(userId: number): Promise<UserActivityStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  const [
    totalPosts,
    totalComments,
    totalLikes,
    totalFavorites,
    totalFollowers,
    totalFollowing,
    postsThisMonth,
    commentsThisMonth,
    lastActivity,
  ] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.like.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.comment.count({
      where: {
        authorId: userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.activityLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ])

  // 计算账户年龄（月）
  const accountAgeMs = now.getTime() - user.createdAt.getTime()
  const accountAgeMonths = Math.max(1, Math.floor(accountAgeMs / (1000 * 60 * 60 * 24 * 30)))

  return {
    totalPosts,
    totalComments,
    totalLikes,
    totalFavorites,
    totalFollowers,
    totalFollowing,
    postsThisMonth,
    commentsThisMonth,
    lastActiveAt: lastActivity?.createdAt || null,
    joinDate: user.createdAt,
    accountAge: accountAgeMonths,
    averagePostsPerMonth: Math.round((totalPosts / accountAgeMonths) * 100) / 100,
  }
}

// 批量操作用户
export async function bulkUpdateUsers(
  userIds: number[],
  action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'delete' | 'changeRole',
  options?: { role?: string },
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  for (const userId of userIds) {
    try {
      switch (action) {
        case 'ban':
          await prisma.user.update({
            where: { id: userId },
            data: { status: 'BANNED' },
          })
          break
        case 'unban':
          await prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
          })
          break
        case 'activate':
          await prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
          })
          break
        case 'deactivate':
          await prisma.user.update({
            where: { id: userId },
            data: { status: 'INACTIVE' },
          })
          break
        case 'delete':
          await prisma.user.delete({
            where: { id: userId },
          })
          break
        case 'changeRole':
          if (!options?.role) {
            throw new Error('Role is required for changeRole action')
          }
          await prisma.user.update({
            where: { id: userId },
            data: { role: options.role },
          })
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }
      result.success++
    } catch (error: any) {
      result.failed++
      result.errors.push(`User ${userId}: ${error.message}`)
    }
  }

  return result
}

// 获取用户统计概览
export async function getUserStatsOverview() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    usersByRole,
    usersByStatus,
    topPosters,
    topCommenters,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'BANNED' } }),
    prisma.user.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfWeek } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
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
        _count: { select: { posts: true } },
      },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { comments: { _count: 'desc' } },
      select: {
        id: true,
        username: true,
        avatar: true,
        _count: { select: { comments: true } },
      },
    }),
  ])

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    usersByRole: usersByRole.map((r) => ({
      role: r.role,
      count: r._count,
    })),
    usersByStatus: usersByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    topPosters: topPosters.map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      postCount: u._count.posts,
    })),
    topCommenters: topCommenters.map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      commentCount: u._count.comments,
    })),
  }
}
