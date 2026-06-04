import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少文章 ID',
    })
  }

  // 查找文章
  const existingPost = await prisma.post.findUnique({
    where: { id },
  })

  if (!existingPost) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 删除文章
  await prisma.post.delete({
    where: { id },
  })

  return {
    code: 200,
    message: '文章删除成功',
  }
})
