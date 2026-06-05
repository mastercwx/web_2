/**
 * 更新通知偏好设置 API
 * PUT /api/notifications/preferences
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

  const body = await readBody(event)

  // 更新邮件通知设置
  if (body.emailNotifications !== undefined) {
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        emailNotifications: body.emailNotifications,
      },
    })
  }

  return {
    success: true,
    message: '通知偏好设置已更新',
  }
})
