import { getDeliveryLogs } from '~/server/utils/webhooks'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const query = getQuery(event)

  const result = await getDeliveryLogs(query.webhookId ? Number(query.webhookId) : undefined, {
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    status: query.status as string | undefined,
    event: query.event as string | undefined,
  })

  return { data: result }
})
