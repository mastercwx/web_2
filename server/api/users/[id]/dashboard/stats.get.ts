import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = Number(getRouterParam(event, 'id'))

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

  // 获取统计数据
  const [
    postCount,
    publishedPostCount,
    commentCount,
    likeCount,
    favoriteCount,
    followerCount,
    followingCount,
    totalViews,
  ] = await Promise.all([
    // 文章总数
    prisma.post.count({
      where: { authorId: userId },
    }),
    // 已发布文章数
    prisma.post.count({
      where: { authorId: userId, published: true },
    }),
    // 评论数（用户发表的评论）
    prisma.comment.count({
      where: { authorId: userId },
    }),
    // 获赞数（用户文章收到的赞）
    prisma.like.count({
      where: {
        post: { authorId: userId },
      },
    }),
    // 被收藏数（用户文章被收藏）
    prisma.favorite.count({
      where: {
        post: { authorId: userId },
      },
    }),
    // 粉丝数
    prisma.follow.count({
      where: { followingId: userId },
    }),
    // 关注数
    prisma.follow.count({
      where: { followerId: userId },
    }),
    // 文章总阅读量（通过阅读历史统计）
    prisma.readingHistory.count({
      where: {
        post: { authorId: userId },
      },
    }),
  ])

  // 获取本月数据
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthlyPosts, monthlyComments, monthlyLikes, monthlyFollowers] = await Promise.all([
    // 本月新文章
    prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    // 本月新评论
    prisma.comment.count({
      where: {
        authorId: userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    // 本月获赞
    prisma.like.count({
      where: {
        post: { authorId: userId },
        createdAt: { gte: startOfMonth },
      },
    }),
    // 本月新粉丝
    prisma.follow.count({
      where: {
        followingId: userId,
        createdAt: { gte: startOfMonth },
      },
    }),
  ])

  return {
    code: 200,
    data: {
      stats: {
        postCount,
        publishedPostCount,
        commentCount,
        likeCount,
        favoriteCount,
        followerCount,
        followingCount,
        totalViews,
      },
      monthly: {
        posts: monthlyPosts,
        comments: monthlyComments,
        likes: monthlyLikes,
        followers: monthlyFollowers,
      },
    },
  }
})
