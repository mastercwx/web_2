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
  const { notificationId, all } = body

  if (all) {
    // 标记所有为已读
    await prisma.notification.updateMany({
      where: {
        userId: auth.userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    return { data: { success: true, message: '已全部标记为已读' } }
  }

  if (!notificationId) {
    throw createError({
      statusCode: 400,
      message: '缺少通知 ID',
    })
  }

  // 检查通知是否属于当前用户
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: auth.userId,
    },
  })

  if (!notification) {
    throw createError({
      statusCode: 404,
      message: '通知不存在',
    })
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })

  return { data: { success: true } }
})
