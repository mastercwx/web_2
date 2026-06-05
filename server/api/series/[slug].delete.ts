import { prisma } from '~/server/utils/prisma'

/**
 * DELETE /api/series/:slug
 * 删除文章系列
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: '缺少系列slug' })
  }

  // 检查系列是否存在
  const existingSeries = await prisma.series.findUnique({
    where: { slug },
  })

  if (!existingSeries) {
    throw createError({ statusCode: 404, message: '系列不存在' })
  }

  // 检查权限（只有作者可以删除）
  if (existingSeries.authorId !== auth.userId) {
    throw createError({ statusCode: 403, message: '没有权限删除此系列' })
  }

  // 将系列中的文章的seriesId设为null
  await prisma.post.updateMany({
    where: { seriesId: existingSeries.id },
    data: { seriesId: null, seriesOrder: null },
  })

  // 删除系列
  await prisma.series.delete({
    where: { slug },
  })

  return { data: { success: true } }
})
