import { prisma } from '~/server/utils/prisma'

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
  const body = await readBody(event)
  const { status } = body

  if (!id || !status) {
    throw createError({
      statusCode: 400,
      message: '缺少必要参数',
    })
  }

  // 验证状态值
  const validStatuses = ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED']
  if (!validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      message: '无效的状态值',
    })
  }

  const experiment = await prisma.experiment.update({
    where: { id: Number.parseInt(id) },
    data: {
      status,
      startDate: status === 'RUNNING' ? new Date() : undefined,
      endDate: status === 'COMPLETED' ? new Date() : undefined,
    },
    include: {
      variants: true,
    },
  })

  return {
    code: 200,
    data: {
      experiment,
    },
    message: '实验状态更新成功',
  }
})
