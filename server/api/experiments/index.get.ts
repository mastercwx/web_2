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

  const experiments = await prisma.experiment.findMany({
    include: {
      variants: true,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return {
    code: 200,
    data: {
      experiments,
    },
  }
})
