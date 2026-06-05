import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权访问' })
  }

  const query = getQuery(event)
  const limit = Number(query['limit']) || 10

  // 获取最多评论的文章
  const topByComments = await prisma.post.findMany({
    where: { published: true },
    orderBy: { comments: { _count: 'desc' } },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      _count: {
        select: { comments: true, likes: true },
      },
    },
  })

  // 获取最多点赞的文章
  const topByLikes = await prisma.post.findMany({
    where: { published: true },
    orderBy: { likes: { _count: 'desc' } },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      _count: {
        select: { comments: true, likes: true },
      },
    },
  })

  // 获取最近的文章（因为没有 views 字段）
  const recentPosts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      _count: {
        select: { comments: true, likes: true },
      },
    },
  })

  // 获取最近活跃的用户
  const activeUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      username: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: { posts: true, comments: true },
      },
    },
  })

  return {
    topByComments,
    topByLikes,
    recentPosts,
    activeUsers,
  }
})
