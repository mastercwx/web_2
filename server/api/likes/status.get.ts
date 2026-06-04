import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = Number(query['postId'])

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章ID',
    })
  }

  // 获取点赞数
  const count = await prisma.like.count({
    where: { postId },
  })

  // 检查当前用户是否已点赞
  let liked = false
  const auth = event.context['auth']
  if (auth) {
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: Number(auth.userId),
        },
      },
    })
    liked = !!existingLike
  }

  return {
    success: true,
    data: { count, liked },
  }
})
