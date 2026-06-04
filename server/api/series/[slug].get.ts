import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/series/:slug
 * 获取单个文章系列详情
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: '缺少系列slug' })
  }

  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      posts: {
        where: { published: true },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          seriesOrder: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: { seriesOrder: 'asc' },
      },
    },
  })

  if (!series) {
    throw createError({ statusCode: 404, message: '系列不存在' })
  }

  return { data: { series } }
})
