import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  // 获取用户的草稿和定时发布文章
  const posts = await prisma.post.findMany({
    where: {
      authorId: auth.userId,
      OR: [{ published: false }, { scheduledAt: { not: null } }],
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      published: true,
      scheduledAt: true,
      createdAt: true,
      updatedAt: true,
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    code: 200,
    data: { posts },
  }
})
