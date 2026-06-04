import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/users/:id/followers
 * 获取用户的粉丝列表
 */
export default defineEventHandler(async (event) => {
  const userId = Number(event.context.params?.['id'])
  if (!userId) {
    throw createError({ statusCode: 400, message: '无效的用户ID' })
  }

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20

  const skip = (page - 1) * pageSize

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.follow.count({
      where: { followingId: userId },
    }),
  ])

  return {
    followers: followers.map((f) => f.follower),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
