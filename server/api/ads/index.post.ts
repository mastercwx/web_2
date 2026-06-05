import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const adContentSchema = z.object({
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
})

const adSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  position: z.enum(['sidebar', 'header', 'footer', 'in-article']),
  type: z.enum(['BANNER', 'SIDEBAR', 'IN_ARTICLE', 'NATIVE', 'POPUP']),
  content: adContentSchema,
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().optional().default(0),
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
  const result = adSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '参数错误',
      data: result.error.issues,
    })
  }

  const ad = await prisma.ad.create({
    data: {
      ...result.data,
      content: JSON.stringify(result.data.content),
    },
  })

  return {
    data: {
      ...ad,
      content: JSON.parse(ad.content),
    },
  }
})
