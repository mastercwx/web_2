import { retryFailedDeliveries } from '~/server/utils/webhooks'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const results = await retryFailedDeliveries()

  return {
    data: {
      retried: results.length,
      results: results.map((r) => r.status),
    },
  }
})
