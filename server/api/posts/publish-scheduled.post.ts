import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  // 查找所有已到时间的定时发布文章
  const now = new Date()
  const scheduledPosts = await prisma.post.findMany({
    where: {
      published: false,
      scheduledAt: {
        lte: now,
      },
    },
  })

  // 批量发布
  if (scheduledPosts.length > 0) {
    await prisma.post.updateMany({
      where: {
        id: {
          in: scheduledPosts.map((p) => p.id),
        },
      },
      data: {
        published: true,
        scheduledAt: null,
      },
    })
  }

  return {
    code: 200,
    message: `已发布 ${scheduledPosts.length} 篇定时文章`,
    data: {
      count: scheduledPosts.length,
    },
  }
})
