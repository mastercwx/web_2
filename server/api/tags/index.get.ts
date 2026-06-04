import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      posts: {
        _count: 'desc',
      },
    },
  })

  return {
    code: 200,
    data: { tags },
  }
})
