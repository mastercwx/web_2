import { prisma } from '~/server/utils/prisma'

/**
 * POST /api/follow/toggle
 * 切换关注状态
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const body = await readBody(event)
  const { userId } = body

  if (!userId) {
    throw createError({ statusCode: 400, message: '用户ID不能为空' })
  }

  if (userId === auth.id) {
    throw createError({ statusCode: 400, message: '不能关注自己' })
  }

  // 检查目标用户是否存在
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!targetUser) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }

  // 检查是否已关注
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: auth.id,
        followingId: userId,
      },
    },
  })

  if (existingFollow) {
    // 取消关注
    await prisma.follow.delete({
      where: { id: existingFollow.id },
    })
    return { followed: false }
  } else {
    // 添加关注
    await prisma.follow.create({
      data: {
        followerId: auth.id,
        followingId: userId,
      },
    })
    return { followed: true }
  }
})
