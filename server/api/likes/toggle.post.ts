import { prisma } from '~/server/utils/prisma'
import { createNotification } from '~/server/utils/notification'
import { logActivityFromEvent, ActivityActions } from '~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)
  const { postId } = body

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章ID',
    })
  }

  const userId = Number(auth.userId)
  const postIdNum = Number(postId)

  // 检查是否已点赞
  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId: postIdNum,
        userId,
      },
    },
  })

  if (existingLike) {
    // 取消点赞
    await prisma.like.delete({
      where: { id: existingLike.id },
    })

    // 记录取消点赞活动
    await logActivityFromEvent(event, ActivityActions.UNLIKE, {
      entity: 'post',
      entityId: postIdNum,
      details: `取消点赞文章 #${postIdNum}`,
    })

    return {
      success: true,
      data: { liked: false },
      message: '已取消点赞',
    }
  } else {
    // 点赞
    await prisma.like.create({
      data: {
        postId: postIdNum,
        userId,
      },
    })

    // 发送通知给文章作者
    const post = await prisma.post.findUnique({
      where: { id: postIdNum },
      select: { authorId: true, title: true, slug: true },
    })

    if (post) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })

      await createNotification({
        userId: post.authorId,
        type: 'like',
        title: '收到新点赞',
        content: `${user?.username || '用户'} 赞了你的文章《${post.title}》`,
        link: `/posts/${post.slug}`,
        actorId: userId,
        postId: postIdNum,
      })
    }

    // 记录点赞活动
    await logActivityFromEvent(event, ActivityActions.LIKE, {
      entity: 'post',
      entityId: postIdNum,
      details: `点赞文章 #${postIdNum}`,
    })

    return {
      success: true,
      data: { liked: true },
      message: '已点赞',
    }
  }
})
