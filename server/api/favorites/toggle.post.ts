import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)
  const { postId } = body

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章ID',
    })
  }

  const userId = Number(auth.userId)
  const postIdNum = Number(postId)

  // 检查是否已收藏
  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      postId_userId: {
        postId: postIdNum,
        userId,
      },
    },
  })

  if (existingFavorite) {
    // 取消收藏
    await prisma.favorite.delete({
      where: { id: existingFavorite.id },
    })
    return {
      success: true,
      data: { favorited: false },
      message: '已取消收藏',
    }
  } else {
    // 收藏
    await prisma.favorite.create({
      data: {
        postId: postIdNum,
        userId,
      },
    })
    return {
      success: true,
      data: { favorited: true },
      message: '已收藏',
    }
  }
})
