import { prisma } from '~/server/utils/prisma'

/**
 * POST /api/series
 * 创建文章系列
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const body = await readBody(event)
  const { title, description, slug, coverImage } = body

  if (!title || !slug) {
    throw createError({ statusCode: 400, message: '标题和slug不能为空' })
  }

  // 检查slug是否已存在
  const existing = await prisma.series.findUnique({
    where: { slug },
  })

  if (existing) {
    throw createError({ statusCode: 400, message: 'slug已存在' })
  }

  const series = await prisma.series.create({
    data: {
      title,
      description,
      slug,
      coverImage,
      authorId: auth.id,
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

  return { data: { series } }
})
