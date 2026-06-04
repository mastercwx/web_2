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

  // 检查是否已点赞
  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId: postIdNum,
        userId,
      },
    },
  })

  if (existingLike) {
    // 取消点赞
    await prisma.like.delete({
      where: { id: existingLike.id },
    })
    return {
      success: true,
      data: { liked: false },
      message: '已取消点赞',
    }
  } else {
    // 点赞
    await prisma.like.create({
      data: {
        postId: postIdNum,
        userId,
      },
    })
    return {
      success: true,
      data: { liked: true },
      message: '已点赞',
    }
  }
})
