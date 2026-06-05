import { getExperimentStats } from '~/server/utils/experiments'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  // 检查是否是管理员
  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '无权访问',
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少实验 ID',
    })
  }

  // 通过 ID 获取实验名称
  const { prisma } = await import('~/server/utils/prisma')
  const experiment = await prisma.experiment.findUnique({
    where: { id: Number.parseInt(id) },
  })

  if (!experiment) {
    throw createError({
      statusCode: 404,
      message: '实验不存在',
    })
  }

  const stats = await getExperimentStats(experiment.name)

  return {
    code: 200,
    data: {
      stats,
    },
  }
})
