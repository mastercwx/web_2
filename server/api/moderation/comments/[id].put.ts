import { prisma } from '~/server/utils/prisma'

/**
 * PUT /api/moderation/comments/:id
 * 审核评论（批准/拒绝）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '没有权限' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少评论ID' })
  }

  const body = await readBody(event)
  const { status } = body // APPROVED or REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw createError({ statusCode: 400, message: '无效的状态' })
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
  })

  if (!comment) {
    throw createError({ statusCode: 404, message: '评论不存在' })
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: { status },
    include: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  })

  return { data: { comment: updatedComment } }
})
