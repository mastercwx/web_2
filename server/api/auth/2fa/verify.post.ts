import { prisma } from '~/server/utils/prisma'
import { verifyTOTP } from '~/server/utils/two-factor'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)

  if (!body.token || !body.setupToken) {
    throw createError({
      statusCode: 400,
      message: '验证码和设置令牌不能为空',
    })
  }

  // 解析 setupToken
  let setupData: { userId: number; secret: string; backupCodes: string[]; timestamp: number }
  try {
    setupData = JSON.parse(Buffer.from(body.setupToken, 'base64').toString())
  } catch {
    throw createError({
      statusCode: 400,
      message: '无效的设置令牌',
    })
  }

  // 验证 setupToken 是否属于当前用户
  if (setupData.userId !== auth.userId) {
    throw createError({
      statusCode: 403,
      message: '无权操作',
    })
  }

  // 检查令牌是否过期（10 分钟）
  if (Date.now() - setupData.timestamp > 10 * 60 * 1000) {
    throw createError({
      statusCode: 400,
      message: '设置令牌已过期，请重新开始设置',
    })
  }

  // 验证 TOTP 令牌
  const isValid = verifyTOTP(body.token, setupData.secret)

  if (!isValid) {
    throw createError({
      statusCode: 400,
      message: '验证码错误',
    })
  }

  // 启用 2FA
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: setupData.secret,
      twoFactorBackupCodes: JSON.stringify(setupData.backupCodes),
    },
  })

  return {
    code: 200,
    message: '两步验证已启用',
  }
})
