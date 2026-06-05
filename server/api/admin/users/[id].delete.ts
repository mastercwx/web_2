import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少用户 ID',
    })
  }

  // 不能删除自己
  if (id === auth.userId) {
    throw createError({
      statusCode: 400,
      message: '不能删除自己的账号',
    })
  }

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

  // 删除用户（级联删除文章）
  await prisma.user.delete({
    where: { id },
  })

  return {
    code: 200,
    message: '用户删除成功',
  }
})
