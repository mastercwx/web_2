import { prisma } from '~/server/utils/prisma'

/**
 * DELETE /api/reading-history/clear
 * 清空阅读历史
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  await prisma.readingHistory.deleteMany({
    where: { userId: auth.userId },
  })

  return { message: '阅读历史已清空' }
})
