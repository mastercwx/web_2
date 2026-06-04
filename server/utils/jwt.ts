import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env['JWT_SECRET'] || 'hg-web-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface JwtPayload {
  userId: number
  username: string
  role: string
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

/**
 * 从请求头提取 Token
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}
