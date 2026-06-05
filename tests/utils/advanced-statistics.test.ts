import { describe, it, expect } from 'vitest'
import { getDateRange } from '~/server/utils/advanced-statistics'

describe('Advanced Statistics Utils', () => {
  describe('getDateRange', () => {
    it('should return start and end dates', () => {
      const range = getDateRange('month')
      expect(range.startDate).toBeInstanceOf(Date)
      expect(range.endDate).toBeInstanceOf(Date)
      expect(range.startDate.getTime()).toBeLessThanOrEqual(range.endDate.getTime())
    })

    it('should handle "today"', () => {
      const range = getDateRange('today')
      const now = new Date()
      expect(range.startDate.getDate()).toBe(now.getDate())
      expect(range.startDate.getHours()).toBe(0)
      expect(range.startDate.getMinutes()).toBe(0)
    })

    it('should handle "yesterday"', () => {
      const range = getDateRange('yesterday')
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(range.startDate.getDate()).toBe(yesterday.getDate())
    })

    it('should handle "week" (7 days ago)', () => {
      const range = getDateRange('week')
      const diff = range.endDate.getTime() - range.startDate.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      expect(days).toBe(7)
    })

    it('should handle "month" (30 days ago)', () => {
      const range = getDateRange('month')
      const diff = range.endDate.getTime() - range.startDate.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      expect(days).toBeGreaterThanOrEqual(28)
      expect(days).toBeLessThanOrEqual(31)
    })

    it('should handle "quarter"', () => {
      const range = getDateRange('quarter')
      const diff = range.endDate.getTime() - range.startDate.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      expect(days).toBeGreaterThanOrEqual(89)
      expect(days).toBeLessThanOrEqual(92)
    })

    it('should handle "year"', () => {
      const range = getDateRange('year')
      const diff = range.endDate.getTime() - range.startDate.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      expect(days).toBeGreaterThanOrEqual(364)
    })

    it('should default to 30 days for unknown period', () => {
      const range = getDateRange('unknown')
      const diff = range.endDate.getTime() - range.startDate.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      expect(days).toBe(30)
    })
  })
})
