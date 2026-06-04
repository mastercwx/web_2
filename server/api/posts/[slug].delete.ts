import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: '缺少文章标识',
    })
  }

  // 查找文章
  const existingPost = await prisma.post.findUnique({
    where: { slug },
  })

  if (!existingPost) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 检查权限（只有作者或管理员可以删除）
  if (existingPost.authorId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限删除此文章',
    })
  }

  // 删除文章
  await prisma.post.delete({
    where: { slug },
  })

  return {
    code: 200,
    message: '文章删除成功',
  }
})
