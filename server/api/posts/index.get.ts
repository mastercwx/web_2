/**
 * 获取文章列表
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 10
  const skip = (page - 1) * pageSize
  const published = query['published'] !== 'false'

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: pageSize,
      where: {
        published,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        published: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.post.count({
      where: {
        published,
      },
    }),
  ])

  return {
    data: posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
