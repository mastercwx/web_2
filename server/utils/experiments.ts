import { prisma } from '~/server/utils/prisma'

/**
 * 获取用户的实验变体
 */
export async function getUserVariant(
  userId: number,
  experimentName: string,
): Promise<string | null> {
  const experiment = await prisma.experiment.findUnique({
    where: { name: experimentName },
  })

  if (!experiment || experiment.status !== 'RUNNING') {
    return null
  }

  // 检查用户是否已分配
  const assignment = await prisma.userExperiment.findUnique({
    where: {
      userId_experimentId: {
        userId,
        experimentId: experiment.id,
      },
    },
    include: {
      variant: true,
    },
  })

  if (assignment) {
    return assignment.variant.name
  }

  // 分配新变体
  const variant = await assignVariant(userId, experiment.id)
  return variant?.name || null
}

/**
 * 为用户分配实验变体
 */
export async function assignVariant(userId: number, experimentId: number) {
  // 获取所有变体
  const variants = await prisma.experimentVariant.findMany({
    where: { experimentId },
  })

  if (variants.length === 0) {
    return null
  }

  // 使用加权随机选择变体
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
  let random = Math.random() * totalWeight

  for (const variant of variants) {
    random -= variant.weight
    if (random <= 0) {
      // 创建分配记录
      await prisma.userExperiment.create({
        data: {
          userId,
          experimentId,
          variantId: variant.id,
        },
      })
      return variant
    }
  }

  // 默认返回第一个变体
  const firstVariant = variants[0]
  await prisma.userExperiment.create({
    data: {
      userId,
      experimentId,
      variantId: firstVariant.id,
    },
  })
  return firstVariant
}

/**
 * 记录实验事件
 */
export async function trackExperimentEvent(
  experimentName: string,
  userId: number | null,
  eventName: string,
  eventValue?: number,
  metadata?: Record<string, any>,
) {
  const experiment = await prisma.experiment.findUnique({
    where: { name: experimentName },
  })

  if (!experiment || experiment.status !== 'RUNNING') {
    return
  }

  // 获取用户的变体
  let variantId: number | null = null

  if (userId) {
    const assignment = await prisma.userExperiment.findUnique({
      where: {
        userId_experimentId: {
          userId,
          experimentId: experiment.id,
        },
      },
    })
    variantId = assignment?.variantId || null
  }

  if (!variantId) {
    return
  }

  // 记录事件
  await prisma.experimentEvent.create({
    data: {
      userId,
      experimentId: experiment.id,
      variantId,
      eventName,
      eventValue,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
}

/**
 * 获取实验统计
 */
export async function getExperimentStats(experimentName: string) {
  const experiment = await prisma.experiment.findUnique({
    where: { name: experimentName },
    include: {
      variants: true,
    },
  })

  if (!experiment) {
    return null
  }

  const stats = await Promise.all(
    experiment.variants.map(async (variant) => {
      // 获取分配到此变体的用户数
      const totalUsers = await prisma.userExperiment.count({
        where: { variantId: variant.id },
      })

      // 获取事件统计
      const events = await prisma.experimentEvent.groupBy({
        by: ['eventName'],
        where: {
          experimentId: experiment.id,
          variantId: variant.id,
        },
        _count: true,
        _sum: {
          eventValue: true,
        },
      })

      return {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        totalUsers,
        events: events.map((e) => ({
          name: e.eventName,
          count: e._count,
          totalValue: e._sum.eventValue,
        })),
      }
    }),
  )

  return {
    experiment: {
      id: experiment.id,
      name: experiment.name,
      status: experiment.status,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
    },
    variants: stats,
  }
}

/**
 * 检查功能开关
 */
export async function isFeatureEnabled(userId: number, featureName: string): Promise<boolean> {
  const variant = await getUserVariant(userId, featureName)
  return variant === 'enabled' || variant === 'treatment'
}
