import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const [totalUsers, totalPosts, publishedPosts, draftPosts, recentUsers, recentPosts] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.post.count({ where: { published: false } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          published: true,
          createdAt: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      }),
    ])

  return {
    code: 200,
    data: {
      totalUsers,
      totalPosts,
      publishedPosts,
      draftPosts,
      recentUsers,
      recentPosts,
    },
  }
})
