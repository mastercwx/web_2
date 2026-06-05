import { describe, it, expect } from 'vitest'
import { generateToken, verifyToken, extractTokenFromHeader } from '~/server/utils/jwt'

describe('JWT Utils', () => {
  const payload = {
    userId: 1,
    username: 'testuser',
    role: 'USER',
  }

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(payload)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(payload)
      const token2 = generateToken({ ...payload, userId: 2 })
      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(payload)
      const decoded = verifyToken(token)
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.username).toBe(payload.username)
      expect(decoded.role).toBe(payload.role)
    })

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow()
    })

    it('should throw on tampered token', () => {
      const token = generateToken(payload)
      const tampered = token.slice(0, -5) + 'XXXXX'
      expect(() => verifyToken(tampered)).toThrow()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'my-jwt-token'
      const result = extractTokenFromHeader(`Bearer ${token}`)
      expect(result).toBe(token)
    })

    it('should return null for undefined header', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(extractTokenFromHeader('')).toBeNull()
    })

    it('should return null for non-Bearer header', () => {
      expect(extractTokenFromHeader('Basic abc123')).toBeNull()
    })

    it('should return null for Bearer without token', () => {
      expect(extractTokenFromHeader('Bearer ')).toBe('')
    })
  })
})
