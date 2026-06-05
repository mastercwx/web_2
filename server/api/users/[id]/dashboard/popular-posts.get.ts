import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const limit = Number(query.limit) || 5

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: '缺少用户ID',
    })
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 获取热门文章（按点赞数排序）
  const popularPosts = await prisma.post.findMany({
    where: {
      authorId: userId,
      published: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          likes: true,
          comments: true,
          favorites: true,
          readingHistory: true,
        },
      },
    },
    orderBy: {
      likes: { _count: 'desc' },
    },
    take: limit,
  })

  // 格式化数据
  const formattedPosts = popularPosts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    createdAt: post.createdAt,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    favoriteCount: post._count.favorites,
    viewCount: post._count.readingHistory,
  }))

  return {
    code: 200,
    data: { posts: formattedPosts },
  }
})
