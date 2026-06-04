import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10
  const search = query['search'] as string | undefined

  const where: any = {}

  if (search) {
    where.OR = [{ username: { contains: search } }, { email: { contains: search } }]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    code: 200,
    data: {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  }
})
