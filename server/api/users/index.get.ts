/**
 * 获取用户列表
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10
  const skip = (page - 1) * pageSize

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: pageSize,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count(),
  ])

  return {
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
