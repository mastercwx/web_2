import crypto from 'node:crypto'
import { prisma } from '~/server/utils/prisma'

// Webhook 事件类型
export const WEBHOOK_EVENTS = [
  'post.created',
  'post.updated',
  'post.deleted',
  'post.published',
  'comment.created',
  'comment.approved',
  'comment.rejected',
  'user.registered',
  'user.updated',
  'user.banned',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

// Webhook 配置接口
interface WebhookConfig {
  name: string
  url: string
  secret?: string
  events: string[]
}

/**
 * 生成 Webhook 签名
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * 验证 Webhook 签名
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

/**
 * 创建 Webhook
 */
export async function createWebhook(config: WebhookConfig) {
  return prisma.webhook.create({
    data: {
      name: config.name,
      url: config.url,
      secret: config.secret,
      events: JSON.stringify(config.events),
    },
  })
}

/**
 * 更新 Webhook
 */
export async function updateWebhook(id: number, config: Partial<WebhookConfig>) {
  const data: Record<string, unknown> = {}

  if (config.name !== undefined) data.name = config.name
  if (config.url !== undefined) data.url = config.url
  if (config.secret !== undefined) data.secret = config.secret
  if (config.events !== undefined) data.events = JSON.stringify(config.events)

  return prisma.webhook.update({
    where: { id },
    data,
  })
}

/**
 * 删除 Webhook
 */
export async function deleteWebhook(id: number) {
  return prisma.webhook.delete({
    where: { id },
  })
}

/**
 * 获取所有活跃的 Webhook
 */
export async function getActiveWebhooks(event?: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true },
  })

  if (!event) return webhooks

  return webhooks.filter((webhook) => {
    const events = JSON.parse(webhook.events) as string[]
    return events.includes(event) || events.includes('*')
  })
}

/**
 * 触发 Webhook 事件
 */
export async function triggerWebhooks(event: string, payload: Record<string, unknown>) {
  const webhooks = await getActiveWebhooks(event)

  if (webhooks.length === 0) return

  const deliveries = webhooks.map((webhook) => ({
    webhookId: webhook.id,
    event,
    payload: JSON.stringify(payload),
    status: 'PENDING' as const,
  }))

  await prisma.webhookDelivery.createMany({
    data: deliveries,
  })

  // 异步处理投递
  const deliveryRecords = await prisma.webhookDelivery.findMany({
    where: {
      event,
      status: 'PENDING',
    },
    include: { webhook: true },
  })

  await Promise.allSettled(deliveryRecords.map((delivery) => processDelivery(delivery)))
}

/**
 * 处理单个 Webhook 投递
 */
export async function processDelivery(delivery: {
  id: number
  webhook: { url: string; secret: string | null }
  payload: string
}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': delivery.payload,
    'User-Agent': 'HG-Web-Webhook/1.0',
  }

  if (delivery.webhook.secret) {
    headers['X-Webhook-Signature'] = generateWebhookSignature(
      delivery.payload,
      delivery.webhook.secret,
    )
  }

  try {
    const response = await fetch(delivery.webhook.url, {
      method: 'POST',
      headers,
      body: delivery.payload,
      signal: AbortSignal.timeout(10000), // 10 秒超时
    })

    const responseText = await response.text()

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        statusCode: response.status,
        response: responseText,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        completedAt: new Date(),
      },
    })

    return {
      success: response.ok,
      statusCode: response.status,
      response: responseText,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'FAILED',
        response: errorMessage,
        completedAt: new Date(),
      },
    })

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * 重试失败的 Webhook 投递
 */
export async function retryFailedDeliveries(maxRetries = 3) {
  const failedDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: maxRetries },
    },
    include: { webhook: true },
  })

  const results = await Promise.allSettled(
    failedDeliveries.map(async (delivery) => {
      // 更新重试次数
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          retryCount: delivery.retryCount + 1,
          status: 'RETRYING',
        },
      })

      return processDelivery(delivery)
    }),
  )

  return results
}

/**
 * 获取 Webhook 投递日志
 */
export async function getDeliveryLogs(
  webhookId?: number,
  options?: {
    page?: number
    limit?: number
    status?: string
    event?: string
  },
) {
  const { page = 1, limit = 20, status, event } = options || {}

  const where = {
    ...(webhookId ? { webhookId } : {}),
    ...(status ? { status: status as 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING' } : {}),
    ...(event ? { event } : {}),
  }

  const [deliveries, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      include: {
        webhook: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.webhookDelivery.count({ where }),
  ])

  return {
    deliveries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * 清理旧的投递日志
 */
export async function cleanupOldDeliveries(daysToKeep = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await prisma.webhookDelivery.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { in: ['SUCCESS', 'FAILED'] },
    },
  })

  return result.count
}
