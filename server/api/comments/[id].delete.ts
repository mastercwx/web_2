import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { post: true },
  })

  if (!comment) {
    throw createError({
      statusCode: 404,
      message: '评论不存在',
    })
  }

  // 只有评论作者、文章作者或管理员可以删除评论
  const isAuthor = comment.authorId === Number(auth.userId)
  const isPostAuthor = comment.post.authorId === Number(auth.userId)
  const isAdmin = auth.role === 'ADMIN'

  if (!isAuthor && !isPostAuthor && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: '没有权限删除此评论',
    })
  }

  await prisma.comment.delete({ where: { id } })

  return {
    success: true,
    message: '评论已删除',
  }
})
