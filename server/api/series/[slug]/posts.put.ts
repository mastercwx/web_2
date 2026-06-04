import { prisma } from '~/server/utils/prisma'

/**
 * PUT /api/series/:slug/posts
 * 更新系列中的文章顺序
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
  const series = await prisma.series.findUnique({
    where: { slug },
  })

  if (!series) {
    throw createError({ statusCode: 404, message: '系列不存在' })
  }

  // 检查权限
  if (series.authorId !== auth.id) {
    throw createError({ statusCode: 403, message: '没有权限编辑此系列' })
  }

  const body = await readBody(event)
  const { posts } = body // [{ postId, order }]

  if (!Array.isArray(posts)) {
    throw createError({ statusCode: 400, message: '参数格式错误' })
  }

  // 批量更新文章的seriesOrder
  const updates = posts.map((item: { postId: number; order: number }) =>
    prisma.post.update({
      where: { id: item.postId },
      data: {
        seriesId: series.id,
        seriesOrder: item.order,
      },
    }),
  )

  await prisma.$transaction(updates)

  return { data: { success: true } }
})
