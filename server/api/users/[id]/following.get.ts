import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/users/:id/following
 * 获取用户关注的人列表
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

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
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
      where: { followerId: userId },
    }),
  ])

  return {
    following: following.map((f) => f.following),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
