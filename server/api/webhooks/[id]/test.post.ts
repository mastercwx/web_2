import { prisma } from '~/server/utils/prisma'
import { processDelivery } from '~/server/utils/webhooks'

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

  const webhook = await prisma.webhook.findUnique({
    where: { id },
  })

  if (!webhook) {
    throw createError({
      statusCode: 404,
      message: 'Webhook 不存在',
    })
  }

  // 创建测试投递记录
  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: '这是一条测试消息',
    },
  }

  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event: 'test',
      payload: JSON.stringify(testPayload),
      status: 'PENDING',
    },
  })

  // 处理投递
  const result = await processDelivery({
    id: delivery.id,
    webhook: { url: webhook.url, secret: webhook.secret },
    payload: JSON.stringify(testPayload),
  })

  return {
    data: {
      deliveryId: delivery.id,
      ...result,
    },
  }
})
