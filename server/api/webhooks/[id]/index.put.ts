import { z } from 'zod'
import { WEBHOOK_EVENTS, updateWebhook } from '~/server/utils/webhooks'

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  secret: z.string().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
})

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

  const body = await readBody(event)
  const result = updateWebhookSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '参数错误',
      data: result.error.issues,
    })
  }

  try {
    const webhook = await updateWebhook(id, result.data)

    return {
      data: {
        ...webhook,
        events: JSON.parse(webhook.events) as string[],
      },
    }
  } catch {
    throw createError({
      statusCode: 404,
      message: 'Webhook 不存在',
    })
  }
})
