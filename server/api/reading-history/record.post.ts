import { prisma } from '~/server/utils/prisma'

/**
 * POST /api/reading-history/record
 * 记录阅读历史
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    return { recorded: false }
  }

  const body = await readBody(event)
  const { postId } = body

  if (!postId) {
    throw createError({ statusCode: 400, message: '文章ID不能为空' })
  }

  // 检查文章是否存在
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: '文章不存在' })
  }

  // 使用 upsert 更新或创建阅读记录
  await prisma.readingHistory.upsert({
    where: {
      userId_postId: {
        userId: auth.userId,
        postId: postId,
      },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      userId: auth.userId,
      postId: postId,
    },
  })

  return { recorded: true }
})
