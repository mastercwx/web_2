import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const adContentSchema = z.object({
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
})

const updateAdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  position: z.enum(['sidebar', 'header', 'footer', 'in-article']).optional(),
  type: z.enum(['BANNER', 'SIDEBAR', 'IN_ARTICLE', 'NATIVE', 'POPUP']).optional(),
  content: adContentSchema.optional(),
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
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
      message: '无效的广告 ID',
    })
  }

  const body = await readBody(event)
  const result = updateAdSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '参数错误',
      data: result.error.errors,
    })
  }

  const data: Record<string, unknown> = { ...result.data }
  if (result.data.content) {
    data.content = JSON.stringify(result.data.content)
  }

  try {
    const ad = await prisma.ad.update({
      where: { id },
      data,
    })

    return {
      data: {
        ...ad,
        content: JSON.parse(ad.content),
      },
    }
  } catch {
    throw createError({
      statusCode: 404,
      message: '广告不存在',
    })
  }
})
