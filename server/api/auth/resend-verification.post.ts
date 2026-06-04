import { createError } from 'h3'
import { randomBytes } from 'node:crypto'
import { prisma } from '~/server/utils/prisma'
import { sendEmail, getVerificationEmailTemplate } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  if (user.emailVerified) {
    throw createError({
      statusCode: 400,
      message: '邮箱已验证',
    })
  }

  // 生成验证令牌
  const verifyToken = randomBytes(32).toString('hex')
  const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时

  // 更新用户
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken,
      verifyTokenExpiry,
    },
  })

  // 发送验证邮件
  const appUrl = process.env['APP_URL'] || 'http://localhost:3000'
  const verificationUrl = `${appUrl}/verify-email?token=${verifyToken}`

  await sendEmail({
    to: user.email,
    subject: '【HG Web】邮箱验证',
    html: getVerificationEmailTemplate(user.username, verificationUrl),
  })

  return {
    code: 200,
    message: '验证邮件已发送，请查收',
  }
})
