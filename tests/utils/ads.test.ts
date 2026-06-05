import { describe, it, expect } from 'vitest'
import { AD_POSITIONS, AD_TYPES } from '~/server/utils/ads'

describe('Ads Utils', () => {
  describe('AD_POSITIONS', () => {
    it('should have 4 positions', () => {
      expect(AD_POSITIONS).toHaveLength(4)
    })

    it('each position should have value and label', () => {
      for (const pos of AD_POSITIONS) {
        expect(pos).toHaveProperty('value')
        expect(pos).toHaveProperty('label')
        expect(typeof pos.value).toBe('string')
        expect(typeof pos.label).toBe('string')
      }
    })

    it('should include sidebar', () => {
      expect(AD_POSITIONS.some((p) => p.value === 'sidebar')).toBe(true)
    })
  })

  describe('AD_TYPES', () => {
    it('should have 5 types', () => {
      expect(AD_TYPES).toHaveLength(5)
    })

    it('each type should have value and label', () => {
      for (const type of AD_TYPES) {
        expect(type).toHaveProperty('value')
        expect(type).toHaveProperty('label')
      }
    })

    it('should include BANNER', () => {
      expect(AD_TYPES.some((t) => t.value === 'BANNER')).toBe(true)
    })
  })
})
