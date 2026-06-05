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

  const body = await readBody(event)
  const { name, description, variants } = body

  if (!name) {
    throw createError({
      statusCode: 400,
      message: '实验名称不能为空',
    })
  }

  // 检查名称是否已存在
  const existing = await prisma.experiment.findUnique({
    where: { name },
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      message: '实验名称已存在',
    })
  }

  // 创建实验
  const experiment = await prisma.experiment.create({
    data: {
      name,
      description,
      variants: {
        create: variants || [
          { name: 'control', isControl: true, weight: 50 },
          { name: 'treatment', isControl: false, weight: 50 },
        ],
      },
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
    message: '实验创建成功',
  }
})
