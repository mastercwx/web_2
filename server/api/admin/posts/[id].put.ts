import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少文章 ID',
    })
  }

  const body = await readBody(event)

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

  // 更新文章
  const post = await prisma.post.update({
    where: { id },
    data: {
      published: body.published,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  return {
    code: 200,
    message: '文章更新成功',
    data: { post },
  }
})
