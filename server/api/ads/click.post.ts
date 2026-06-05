import { z } from 'zod'
import { recordClick } from '~/server/utils/ads'

const clickSchema = z.object({
  adId: z.number().int(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = clickSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '参数错误',
    })
  }

  const headers = getRequestHeaders(event)
  const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
  const userAgent = headers['user-agent'] || 'unknown'

  const auth = event.context['auth']
  await recordClick(result.data.adId, auth?.id, ip as string, userAgent)

  return { success: true }
})
