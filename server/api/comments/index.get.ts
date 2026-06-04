import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = Number(query['postId'])
  const showAll = query['all'] === 'true' // 管理员可以看到所有评论

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章ID',
    })
  }

  // 检查是否是管理员
  const auth = event.context['auth']
  const isAdmin = auth?.role === 'ADMIN'

  const where: any = { postId, parentId: null }
  // 非管理员只能看到已批准的评论
  if (!isAdmin || !showAll) {
    where.status = 'APPROVED'
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      replies: {
        where: isAdmin && showAll ? {} : { status: 'APPROVED' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    success: true,
    data: { comments },
  }
})
