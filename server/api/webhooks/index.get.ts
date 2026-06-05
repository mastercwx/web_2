import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const webhooks = await prisma.webhook.findMany({
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    data: webhooks.map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events) as string[],
    })),
  }
})
