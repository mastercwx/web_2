import { prisma } from '~/server/utils/prisma'
import { createNotification } from '~/server/utils/notification'

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

  const userId = Number(auth.userId)

  const comment = await prisma.comment.create({
    data: {
      content,
      postId: Number(postId),
      authorId: userId,
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

  // 发送通知给文章作者
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  })

  await createNotification({
    userId: post.authorId,
    type: 'comment',
    title: '收到新评论',
    content: `${user?.username || '用户'} 评论了你的文章《${post.title}》：${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
    link: `/posts/${post.slug}`,
    actorId: userId,
    postId: Number(postId),
  })

  return {
    success: true,
    data: { comment },
  }
})
