/**
 * 获取通知偏好设置 API
 * GET /api/notifications/preferences
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth?.userId) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      emailNotifications: true,
      emailVerified: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 获取用户的通知偏好设置
  // 可以扩展为从单独的表中获取更详细的偏好设置
  const preferences = {
    emailNotifications: user.emailNotifications,
    emailVerified: user.emailVerified,
    // 以下为前端本地存储的偏好设置
    browserNotifications: true,
    soundEnabled: true,
    types: {
      like: true,
      comment: true,
      follow: true,
      system: true,
    },
  }

  return {
    success: true,
    data: preferences,
  }
})
