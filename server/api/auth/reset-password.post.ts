import { prisma } from '~/server/utils/prisma'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, password } = body

  if (!token || !password) {
    throw createError({
      statusCode: 400,
      message: '请提供重置令牌和新密码',
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      message: '密码长度不能少于 6 个字符',
    })
  }

  // 查找有效的重置令牌
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(), // 令牌未过期
      },
    },
  })

  if (!user) {
    throw createError({
      statusCode: 400,
      message: '重置令牌无效或已过期',
    })
  }

  // 加密新密码
  const hashedPassword = await bcrypt.hash(password, 10)

  // 更新密码并清除重置令牌
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  return {
    code: 200,
    message: '密码重置成功，请使用新密码登录',
  }
})
