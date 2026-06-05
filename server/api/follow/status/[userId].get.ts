import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/follow/status/:userId
 * 获取关注状态
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    return { isFollowing: false }
  }

  const userId = Number(event.context.params?.['userId'])
  if (!userId) {
    throw createError({ statusCode: 400, message: '无效的用户ID' })
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: auth.userId,
        followingId: userId,
      },
    },
  })

  return { isFollowing: !!follow }
})
