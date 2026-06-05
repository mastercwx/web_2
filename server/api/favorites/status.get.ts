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

  // 获取收藏数
  const count = await prisma.favorite.count({
    where: { postId },
  })

  // 检查当前用户是否已收藏
  let favorited = false
  const auth = event.context['auth']
  if (auth) {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: Number(auth.userId),
        },
      },
    })
    favorited = !!existingFavorite
  }

  return {
    success: true,
    data: { count, favorited },
  }
})
