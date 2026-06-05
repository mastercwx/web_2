import { generateSecret as _generateSecret, generateSync, verifySync, generateURI } from 'otplib'
import QRCode from 'qrcode'
import { randomBytes } from 'node:crypto'

// 生成 2FA 密钥
export function generateSecret(): string {
  return _generateSecret()
}

// 生成备份恢复码
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // 生成 8 位随机码，格式为 XXXX-XXXX
    const bytes = randomBytes(4)
    const code = bytes.toString('hex').toUpperCase().slice(0, 8)
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

// 生成 TOTP 令牌
export function generateTOTP(secret: string): string {
  return generateSync({ secret })
}

// 验证 TOTP 令牌
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret })
    return result.valid
  } catch {
    return false
  }
}

// 生成二维码数据 URL
export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

// 生成 otpauth URI
export function generateOTPAuthURI(
  username: string,
  secret: string,
  issuer: string = 'HG Web',
): string {
  return generateURI({ issuer, label: username, secret })
}

// 验证备份恢复码
export function verifyBackupCode(inputCode: string, storedCodes: string): boolean {
  const codes = JSON.parse(storedCodes) as string[]
  const normalizedInput = inputCode.toUpperCase().replace(/[^A-Z0-9]/g, '')

  for (const code of codes) {
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (normalizedInput === normalizedCode) {
      return true
    }
  }

  return false
}

// 移除已使用的备份恢复码
export function removeUsedBackupCode(usedCode: string, storedCodes: string): string {
  const codes = JSON.parse(storedCodes) as string[]
  const normalizedUsed = usedCode.toUpperCase().replace(/[^A-Z0-9]/g, '')

  const remainingCodes = codes.filter((code) => {
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return normalizedUsed !== normalizedCode
  })

  return JSON.stringify(remainingCodes)
}
