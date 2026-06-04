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
  const { content, postId, parentId } = body

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

  // 如果是回复评论，检查父评论是否存在
  let parentComment = null
  if (parentId) {
    parentComment = await prisma.comment.findUnique({
      where: { id: Number(parentId) },
      select: { id: true, authorId: true, postId: true },
    })

    if (!parentComment || parentComment.postId !== Number(postId)) {
      throw createError({
        statusCode: 400,
        message: '父评论不存在',
      })
    }
  }

  const userId = Number(auth.userId)

  const comment = await prisma.comment.create({
    data: {
      content,
      postId: Number(postId),
      authorId: userId,
      parentId: parentId ? Number(parentId) : null,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      parent: {
        select: {
          id: true,
          content: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  })

  // 获取当前用户信息
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  })

  // 如果是回复评论，通知被回复的用户
  if (parentComment && parentComment.authorId !== userId) {
    await createNotification({
      userId: parentComment.authorId,
      type: 'comment',
      title: '收到评论回复',
      content: `${user?.username || '用户'} 回复了你的评论：${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      link: `/posts/${post.slug}`,
      actorId: userId,
      postId: Number(postId),
    })
  }

  // 通知文章作者（如果不是自己评论自己的文章，且不是回复评论时已通知的情况）
  if (post.authorId !== userId && (!parentComment || parentComment.authorId !== post.authorId)) {
    await createNotification({
      userId: post.authorId,
      type: 'comment',
      title: '收到新评论',
      content: `${user?.username || '用户'} 评论了你的文章《${post.title}》：${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      link: `/posts/${post.slug}`,
      actorId: userId,
      postId: Number(postId),
    })
  }

  // 如果评论需要审核，通知管理员
  const setting = await prisma.setting.findUnique({
    where: { key: 'comment_moderation' },
  })

  if (setting?.value === 'true') {
    // 获取所有管理员
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    // 通知所有管理员
    for (const admin of admins) {
      if (admin.id !== userId) {
        await createNotification({
          userId: admin.id,
          type: 'system',
          title: '新评论待审核',
          content: `${user?.username || '用户'} 在文章《${post.title}》发表了新评论，等待审核`,
          link: `/admin/moderation`,
          actorId: userId,
          postId: Number(postId),
        })
      }
    }
  }

  return {
    success: true,
    data: { comment },
  }
})
