import { prisma } from '~/server/utils/prisma'

// 广告位置
export const AD_POSITIONS = [
  { value: 'sidebar', label: '侧边栏' },
  { value: 'header', label: '页头' },
  { value: 'footer', label: '页脚' },
  { value: 'in-article', label: '文章内' },
] as const

// 广告类型
export const AD_TYPES = [
  { value: 'BANNER', label: '横幅广告' },
  { value: 'SIDEBAR', label: '侧边栏广告' },
  { value: 'IN_ARTICLE', label: '文章内广告' },
  { value: 'NATIVE', label: '原生广告' },
  { value: 'POPUP', label: '弹窗广告' },
] as const

// 广告内容接口
interface AdContent {
  imageUrl?: string
  linkUrl?: string
  html?: string
  text?: string
}

/**
 * 获取指定位置的活跃广告
 */
export async function getActiveAds(position: string) {
  const now = new Date()

  const ads = await prisma.ad.findMany({
    where: {
      position,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: 'desc' },
  })

  return ads.map((ad) => ({
    ...ad,
    content: JSON.parse(ad.content) as AdContent,
  }))
}

/**
 * 记录广告展示
 */
export async function recordImpression(
  adId: number,
  userId?: number,
  ip?: string,
  userAgent?: string,
) {
  return prisma.adImpression.create({
    data: {
      adId,
      userId,
      ip,
      userAgent,
    },
  })
}

/**
 * 记录广告点击
 */
export async function recordClick(adId: number, userId?: number, ip?: string, userAgent?: string) {
  return prisma.adClick.create({
    data: {
      adId,
      userId,
      ip,
      userAgent,
    },
  })
}

/**
 * 获取广告统计
 */
export async function getAdStats(adId: number) {
  const [impressions, clicks, ad] = await Promise.all([
    prisma.adImpression.count({ where: { adId } }),
    prisma.adClick.count({ where: { adId } }),
    prisma.ad.findUnique({ where: { id: adId } }),
  ])

  if (!ad) {
    throw new Error('广告不存在')
  }

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

  return {
    adId,
    adName: ad.name,
    impressions,
    clicks,
    ctr: Math.round(ctr * 100) / 100, // 保留两位小数
  }
}

/**
 * 获取所有广告统计
 */
export async function getAllAdStats() {
  const ads = await prisma.ad.findMany({
    include: {
      _count: {
        select: {
          impressions: true,
          clicks: true,
        },
      },
    },
  })

  return ads.map((ad) => ({
    id: ad.id,
    name: ad.name,
    position: ad.position,
    type: ad.type,
    isActive: ad.isActive,
    impressions: ad._count.impressions,
    clicks: ad._count.clicks,
    ctr:
      ad._count.impressions > 0
        ? Math.round((ad._count.clicks / ad._count.impressions) * 10000) / 100
        : 0,
  }))
}

/**
 * 获取广告每日统计
 */
export async function getAdDailyStats(adId: number, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [impressions, clicks] = await Promise.all([
    prisma.adImpression.groupBy({
      by: ['createdAt'],
      where: {
        adId,
        createdAt: { gte: startDate },
      },
      _count: true,
    }),
    prisma.adClick.groupBy({
      by: ['createdAt'],
      where: {
        adId,
        createdAt: { gte: startDate },
      },
      _count: true,
    }),
  ])

  // 按日期聚合
  const dailyStats: Record<string, { impressions: number; clicks: number }> = {}

  impressions.forEach((item) => {
    const date = item.createdAt.toISOString().split('T')[0] || ''
    if (!dailyStats[date]) {
      dailyStats[date] = { impressions: 0, clicks: 0 }
    }
    dailyStats[date].impressions += item._count
  })

  clicks.forEach((item) => {
    const date = item.createdAt.toISOString().split('T')[0] || ''
    if (!dailyStats[date]) {
      dailyStats[date] = { impressions: 0, clicks: 0 }
    }
    dailyStats[date].clicks += item._count
  })

  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    ...stats,
    ctr: stats.impressions > 0 ? Math.round((stats.clicks / stats.impressions) * 10000) / 100 : 0,
  }))
}
