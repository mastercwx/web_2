import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const ads = await prisma.ad.findMany({
    include: {
      _count: {
        select: {
          impressions: true,
          clicks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    data: ads.map((ad) => ({
      ...ad,
      content: JSON.parse(ad.content),
      impressions: ad._count.impressions,
      clicks: ad._count.clicks,
    })),
  }
})
