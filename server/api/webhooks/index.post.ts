import { z } from 'zod'
import { WEBHOOK_EVENTS, createWebhook } from '~/server/utils/webhooks'

const webhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
})

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const body = await readBody(event)
  const result = webhookSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '参数错误',
      data: result.error.errors,
    })
  }

  const webhook = await createWebhook(result.data)

  return {
    data: {
      ...webhook,
      events: JSON.parse(webhook.events) as string[],
    },
  }
})
