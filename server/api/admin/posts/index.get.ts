import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10
  const search = query['search'] as string | undefined
  const published = query['published'] as string | undefined

  const where: any = {}

  if (search) {
    where.OR = [{ title: { contains: search } }, { content: { contains: search } }]
  }

  if (published !== undefined) {
    where.published = published === 'true'
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ pinned: 'desc' }, { featured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        pinned: true,
        featured: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
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
