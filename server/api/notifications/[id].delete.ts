import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少通知 ID',
    })
  }

  // 检查通知是否属于当前用户
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: auth.id,
    },
  })

  if (!notification) {
    throw createError({
      statusCode: 404,
      message: '通知不存在',
    })
  }

  await prisma.notification.delete({
    where: { id },
  })

  return { data: { success: true } }
})
