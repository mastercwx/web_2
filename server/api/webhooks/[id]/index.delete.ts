import { deleteWebhook } from '~/server/utils/webhooks'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: '无效的 Webhook ID',
    })
  }

  try {
    await deleteWebhook(id)

    return { success: true }
  } catch {
    throw createError({
      statusCode: 404,
      message: 'Webhook 不存在',
    })
  }
})
