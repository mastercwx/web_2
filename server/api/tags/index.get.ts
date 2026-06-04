import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sortBy = (query['sortBy'] as string) || 'count' // count or name
  const order = (query['order'] as string) || 'desc'

  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy:
      sortBy === 'name'
        ? { name: order as 'asc' | 'desc' }
        : { posts: { _count: order as 'asc' | 'desc' } },
  })

  return {
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      postCount: tag._count.posts,
    })),
  }
})
