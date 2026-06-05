import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少用户 ID',
    })
  }

  const body = await readBody(event)

  // 查找用户
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 更新用户
  const user = await prisma.user.update({
    where: { id },
    data: {
      role: body.role,
      status: body.status,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  return {
    code: 200,
    message: '用户更新成功',
    data: { user },
  }
})
