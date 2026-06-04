import { prisma } from '~/server/utils/prisma'
import {
  generateSecret,
  generateBackupCodes,
  generateOTPAuthURI,
  generateQRCodeDataURL,
} from '~/server/utils/two-factor'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  // 检查是否已启用 2FA
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      username: true,
      email: true,
      twoFactorEnabled: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  if (user.twoFactorEnabled) {
    throw createError({
      statusCode: 400,
      message: '两步验证已启用',
    })
  }

  // 生成密钥和备份码
  const secret = generateSecret()
  const backupCodes = generateBackupCodes()
  const otpauthURI = generateOTPAuthURI(user.username, secret)
  const qrCodeDataURL = await generateQRCodeDataURL(otpauthURI)

  // 临时存储密钥和备份码（尚未启用）
  // 使用 token 关联，验证后才真正启用
  const setupToken = Buffer.from(
    JSON.stringify({
      userId: user.id,
      secret,
      backupCodes,
      timestamp: Date.now(),
    }),
  ).toString('base64')

  return {
    code: 200,
    data: {
      secret,
      qrCode: qrCodeDataURL,
      backupCodes,
      setupToken,
    },
  }
})
