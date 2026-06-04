import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token } = body

  if (!token) {
    throw createError({
      statusCode: 400,
      message: '验证令牌无效',
    })
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { verifyToken: token },
  })

  if (!user) {
    throw createError({
      statusCode: 400,
      message: '验证令牌无效或已过期',
    })
  }

  // 检查令牌是否过期
  if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
    throw createError({
      statusCode: 400,
      message: '验证令牌已过期，请重新申请验证邮件',
    })
  }

  // 更新用户状态
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  })

  return {
    code: 200,
    message: '邮箱验证成功',
  }
})
