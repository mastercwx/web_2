import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10
  const tag = query['tag'] as string | undefined
  const search = query['search'] as string | undefined

  const where: any = {
    published: true,
  }

  // 标签筛选
  if (tag) {
    where.tags = {
      some: {
        name: tag,
      },
    }
  }

  // 搜索
  if (search) {
    where.OR = [{ title: { contains: search } }, { content: { contains: search } }]
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ])

  return {
    code: 200,
    data: {
      posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  }
})
