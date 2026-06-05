import { describe, it, expect } from 'vitest'
import {
  generateSecret,
  generateBackupCodes,
  generateTOTP,
  verifyTOTP,
  generateOTPAuthURI,
  verifyBackupCode,
  removeUsedBackupCode,
} from '~/server/utils/two-factor'

describe('Two-Factor Auth Utils', () => {
  describe('generateSecret', () => {
    it('should generate a base32 secret string', () => {
      const secret = generateSecret()
      expect(secret).toBeTruthy()
      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(10)
      // Base32 alphabet
      expect(secret).toMatch(/^[A-Z2-7]+=*$/)
    })

    it('should generate unique secrets', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()
      expect(secret1).not.toBe(secret2)
    })
  })

  describe('generateBackupCodes', () => {
    it('should generate default 8 backup codes', () => {
      const codes = generateBackupCodes()
      expect(codes).toHaveLength(8)
    })

    it('should generate custom number of codes', () => {
      const codes = generateBackupCodes(4)
      expect(codes).toHaveLength(4)
    })

    it('should generate codes in XXXX-XXXX format', () => {
      const codes = generateBackupCodes()
      for (const code of codes) {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
      }
    })

    it('should generate unique codes', () => {
      const codes = generateBackupCodes(20)
      const unique = new Set(codes)
      expect(unique.size).toBe(codes.length)
    })
  })

  describe('generateTOTP and verifyTOTP', () => {
    it('should generate and verify a valid TOTP token', () => {
      const secret = generateSecret()
      const token = generateTOTP(secret)
      expect(token).toMatch(/^\d{6}$/)
      expect(verifyTOTP(token, secret)).toBe(true)
    })

    it('should reject invalid token', () => {
      const secret = generateSecret()
      expect(verifyTOTP('000000', secret)).toBe(false)
    })

    it('should reject token with wrong secret', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()
      const token = generateTOTP(secret1)
      expect(verifyTOTP(token, secret2)).toBe(false)
    })

    it('should handle invalid input gracefully', () => {
      expect(verifyTOTP('invalid', 'invalid')).toBe(false)
    })
  })

  describe('generateOTPAuthURI', () => {
    it('should generate a valid otpauth URI', () => {
      const secret = generateSecret()
      const uri = generateOTPAuthURI('testuser', secret)
      expect(uri).toMatch(/^otpauth:\/\/totp\//)
      expect(uri).toContain('testuser')
      expect(uri).toContain('HG%20Web')
    })

    it('should use custom issuer', () => {
      const secret = generateSecret()
      const uri = generateOTPAuthURI('testuser', secret, 'MyApp')
      expect(uri).toContain('MyApp')
    })
  })

  describe('verifyBackupCode', () => {
    const storedCodes = JSON.stringify(['ABCD-1234', 'EFGH-5678', 'IJKL-9012'])

    it('should verify a valid backup code', () => {
      expect(verifyBackupCode('ABCD-1234', storedCodes)).toBe(true)
    })

    it('should verify case-insensitively', () => {
      expect(verifyBackupCode('abcd-1234', storedCodes)).toBe(true)
    })

    it('should reject unknown code', () => {
      expect(verifyBackupCode('XXXX-XXXX', storedCodes)).toBe(false)
    })

    it('should handle code without dashes', () => {
      expect(verifyBackupCode('ABCD1234', storedCodes)).toBe(true)
    })
  })

  describe('removeUsedBackupCode', () => {
    it('should remove used backup code', () => {
      const storedCodes = JSON.stringify(['ABCD-1234', 'EFGH-5678', 'IJKL-9012'])
      const result = removeUsedBackupCode('ABCD-1234', storedCodes)
      const codes = JSON.parse(result)
      expect(codes).toHaveLength(2)
      expect(codes).not.toContain('ABCD-1234')
    })

    it('should not modify codes if code not found', () => {
      const storedCodes = JSON.stringify(['ABCD-1234', 'EFGH-5678'])
      const result = removeUsedBackupCode('XXXX-XXXX', storedCodes)
      const codes = JSON.parse(result)
      expect(codes).toHaveLength(2)
    })

    it('should handle case-insensitive removal', () => {
      const storedCodes = JSON.stringify(['ABCD-1234', 'EFGH-5678'])
      const result = removeUsedBackupCode('abcd-1234', storedCodes)
      const codes = JSON.parse(result)
      expect(codes).toHaveLength(1)
    })
  })
})
