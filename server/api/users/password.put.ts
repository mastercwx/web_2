import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)
  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw createError({
      statusCode: 400,
      message: '请填写所有必填字段',
    })
  }

  if (newPassword.length < 6) {
    throw createError({
      statusCode: 400,
      message: '新密码长度不能少于 6 个字符',
    })
  }

  if (newPassword !== confirmPassword) {
    throw createError({
      statusCode: 400,
      message: '两次输入的密码不一致',
    })
  }

  // 获取当前用户
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 验证当前密码
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 400,
      message: '当前密码不正确',
    })
  }

  // 加密新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 更新密码
  await prisma.user.update({
    where: { id: auth.userId },
    data: { password: hashedPassword },
  })

  return {
    code: 200,
    message: '密码修改成功',
  }
})
