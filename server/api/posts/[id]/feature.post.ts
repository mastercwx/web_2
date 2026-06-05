import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const postId = Number(event.context.params?.['id'])

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '文章ID不能为空',
    })
  }

  // 检查文章是否存在
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, featured: true, title: true },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 切换推荐状态
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: { featured: !post.featured },
    select: { id: true, title: true, featured: true },
  })

  return {
    code: 200,
    message: updatedPost.featured ? '文章已设为推荐' : '文章已取消推荐',
    data: updatedPost,
  }
})
