import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)
  const { content, postId } = body

  if (!content || !postId) {
    throw createError({
      statusCode: 400,
      message: '缺少必要字段',
    })
  }

  if (content.length < 1 || content.length > 1000) {
    throw createError({
      statusCode: 400,
      message: '评论内容长度需要在 1-1000 个字符之间',
    })
  }

  // 检查文章是否存在
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId: Number(postId),
      authorId: Number(auth.userId),
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  })

  return {
    success: true,
    data: { comment },
  }
})
