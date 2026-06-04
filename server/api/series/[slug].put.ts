import { prisma } from '~/server/utils/prisma'

/**
 * PUT /api/series/:slug
 * 更新文章系列
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

  // 检查权限（只有作者可以编辑）
  if (existingSeries.authorId !== auth.id) {
    throw createError({ statusCode: 403, message: '没有权限编辑此系列' })
  }

  const body = await readBody(event)
  const { title, description, coverImage } = body

  const updatedSeries = await prisma.series.update({
    where: { slug },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(coverImage !== undefined && { coverImage }),
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: { posts: true },
      },
    },
  })

  return { data: { series: updatedSeries } }
})
