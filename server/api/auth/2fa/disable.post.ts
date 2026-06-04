import { prisma } from '~/server/utils/prisma'
import { verifyTOTP, verifyBackupCode } from '~/server/utils/two-factor'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)

  if (!body.token) {
    throw createError({
      statusCode: 400,
      message: '验证码不能为空',
    })
  }

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  })

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw createError({
      statusCode: 400,
      message: '两步验证未启用',
    })
  }

  // 验证 TOTP 令牌或备份码
  let isValid = verifyTOTP(body.token, user.twoFactorSecret)

  if (!isValid && user.twoFactorBackupCodes) {
    isValid = verifyBackupCode(body.token, user.twoFactorBackupCodes)
  }

  if (!isValid) {
    throw createError({
      statusCode: 400,
      message: '验证码错误',
    })
  }

  // 禁用 2FA
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  })

  return {
    code: 200,
    message: '两步验证已禁用',
  }
})
