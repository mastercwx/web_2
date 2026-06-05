import { prisma } from '~/server/utils/prisma'

/**
 * DELETE /api/reading-history/:id
 * 删除单条阅读历史
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const id = Number(event.context.params?.['id'])
  if (!id) {
    throw createError({ statusCode: 400, message: '无效的ID' })
  }

  // 检查记录是否存在且属于当前用户
  const record = await prisma.readingHistory.findUnique({
    where: { id },
  })

  if (!record) {
    throw createError({ statusCode: 404, message: '记录不存在' })
  }

  if (record.userId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权删除此记录' })
  }

  await prisma.readingHistory.delete({
    where: { id },
  })

  return { message: '已删除' }
})
