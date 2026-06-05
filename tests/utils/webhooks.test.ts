import { describe, it, expect } from 'vitest'
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  WEBHOOK_EVENTS,
} from '~/server/utils/webhooks'

describe('Webhook Utils', () => {
  describe('generateWebhookSignature', () => {
    it('should generate a hex signature', () => {
      const sig = generateWebhookSignature('test payload', 'my-secret')
      expect(sig).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })

    it('should generate consistent signatures', () => {
      const sig1 = generateWebhookSignature('payload', 'secret')
      const sig2 = generateWebhookSignature('payload', 'secret')
      expect(sig1).toBe(sig2)
    })

    it('should generate different signatures for different payloads', () => {
      const sig1 = generateWebhookSignature('payload1', 'secret')
      const sig2 = generateWebhookSignature('payload2', 'secret')
      expect(sig1).not.toBe(sig2)
    })

    it('should generate different signatures for different secrets', () => {
      const sig1 = generateWebhookSignature('payload', 'secret1')
      const sig2 = generateWebhookSignature('payload', 'secret2')
      expect(sig1).not.toBe(sig2)
    })
  })

  describe('verifyWebhookSignature', () => {
    it('should verify a valid signature', () => {
      const payload = 'test payload'
      const secret = 'my-secret'
      const signature = generateWebhookSignature(payload, secret)
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true)
    })

    it('should reject invalid signature', () => {
      const invalidSig = 'a'.repeat(64) // Same length as SHA-256 hex but wrong
      expect(verifyWebhookSignature('payload', invalidSig, 'secret')).toBe(false)
    })

    it('should reject wrong secret', () => {
      const signature = generateWebhookSignature('payload', 'secret1')
      expect(verifyWebhookSignature('payload', signature, 'secret2')).toBe(false)
    })

    it('should reject tampered payload', () => {
      const signature = generateWebhookSignature('payload', 'secret')
      expect(verifyWebhookSignature('tampered', signature, 'secret')).toBe(false)
    })
  })

  describe('WEBHOOK_EVENTS', () => {
    it('should contain expected event types', () => {
      expect(WEBHOOK_EVENTS).toContain('post.created')
      expect(WEBHOOK_EVENTS).toContain('comment.approved')
      expect(WEBHOOK_EVENTS).toContain('user.registered')
    })

    it('should have 10 event types', () => {
      expect(WEBHOOK_EVENTS).toHaveLength(10)
    })
  })
})
