import { prisma } from '~/server/utils/prisma'
import { generateToken } from '~/server/utils/jwt'
import { verifyTOTP, verifyBackupCode, removeUsedBackupCode } from '~/server/utils/two-factor'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.tempToken || !body.code) {
    throw createError({
      statusCode: 400,
      message: '临时令牌和验证码不能为空',
    })
  }

  // 解析临时令牌
  let tempData: { userId: number; timestamp: number }
  try {
    tempData = JSON.parse(Buffer.from(body.tempToken, 'base64').toString())
  } catch {
    throw createError({
      statusCode: 400,
      message: '无效的临时令牌',
    })
  }

  // 检查临时令牌是否过期（5 分钟）
  if (Date.now() - tempData.timestamp > 5 * 60 * 1000) {
    throw createError({
      statusCode: 400,
      message: '临时令牌已过期，请重新登录',
    })
  }

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: tempData.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  })

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw createError({
      statusCode: 400,
      message: '用户不存在或两步验证未启用',
    })
  }

  // 检查用户状态
  if (user.status !== 'ACTIVE') {
    throw createError({
      statusCode: 403,
      message: '账号已被禁用',
    })
  }

  // 验证 TOTP 令牌
  let isValid = verifyTOTP(body.code, user.twoFactorSecret)

  // 如果 TOTP 验证失败，尝试备份码
  if (!isValid && user.twoFactorBackupCodes) {
    isValid = verifyBackupCode(body.code, user.twoFactorBackupCodes)

    // 如果备份码有效，移除已使用的备份码
    if (isValid) {
      const updatedBackupCodes = removeUsedBackupCode(body.code, user.twoFactorBackupCodes)
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: updatedBackupCodes },
      })
    }
  }

  if (!isValid) {
    throw createError({
      statusCode: 400,
      message: '验证码错误',
    })
  }

  // 生成 Token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  return {
    code: 200,
    message: '验证成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: new Date().toISOString(),
      },
      token,
    },
  }
})
