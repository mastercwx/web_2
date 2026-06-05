import { prisma } from '~/server/utils/prisma'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      message: '请提供邮箱地址',
    })
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // 无论用户是否存在都返回成功（防止邮箱枚举攻击）
  if (!user) {
    return {
      code: 200,
      message: '如果该邮箱已注册，您将收到重置密码的邮件',
    }
  }

  // 生成重置令牌
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 3600000) // 1小时后过期

  // 保存令牌到数据库
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  })

  // TODO: 发送重置邮件
  // 在实际应用中，这里应该发送邮件
  // 现在我们将令牌返回用于测试
  console.log(`密码重置令牌 (${email}): ${resetToken}`)

  return {
    code: 200,
    message: '如果该邮箱已注册，您将收到重置密码的邮件',
    // 测试用，生产环境应删除
    debug: {
      resetToken,
      expiresIn: '1小时',
    },
  }
})
