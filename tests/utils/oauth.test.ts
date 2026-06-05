import { describe, it, expect } from 'vitest'
import { generateOAuthState, verifyOAuthState, OAUTH_PROVIDERS } from '~/server/utils/oauth'

describe('OAuth Utils', () => {
  describe('generateOAuthState', () => {
    it('should generate a non-empty string', () => {
      const state = generateOAuthState()
      expect(state).toBeTruthy()
      expect(typeof state).toBe('string')
      expect(state.length).toBeGreaterThan(10)
    })

    it('should generate unique states', () => {
      const state1 = generateOAuthState()
      const state2 = generateOAuthState()
      expect(state1).not.toBe(state2)
    })
  })

  describe('verifyOAuthState', () => {
    it('should return true for matching states', () => {
      expect(verifyOAuthState('abc123', 'abc123')).toBe(true)
    })

    it('should return false for non-matching states', () => {
      expect(verifyOAuthState('abc123', 'xyz789')).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(verifyOAuthState('ABC', 'abc')).toBe(false)
    })
  })

  describe('OAUTH_PROVIDERS', () => {
    it('should have github provider', () => {
      expect(OAUTH_PROVIDERS.github).toBeDefined()
      expect(OAUTH_PROVIDERS.github.name).toBe('GitHub')
    })

    it('should have google provider', () => {
      expect(OAUTH_PROVIDERS.google).toBeDefined()
      expect(OAUTH_PROVIDERS.google.name).toBe('Google')
    })

    it('should have authorizeUrl for each provider', () => {
      for (const provider of Object.values(OAUTH_PROVIDERS)) {
        expect(provider.authorizeUrl).toBeTruthy()
        expect(provider.authorizeUrl).toMatch(/^https:\/\//)
      }
    })
  })
})
