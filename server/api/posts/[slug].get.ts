import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: '缺少文章标识',
    })
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  return {
    code: 200,
    data: { post },
  }
})
