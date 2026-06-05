import { describe, it, expect } from 'vitest'
import { calculateSensitivityScore } from '~/server/utils/content-moderation'

describe('Content Moderation Utils', () => {
  describe('calculateSensitivityScore', () => {
    it('should return 0 for clean content', () => {
      const result = calculateSensitivityScore('这是一篇关于技术的文章')
      expect(result.score).toBe(0)
      expect(result.flags).toHaveLength(0)
    })

    it('should detect sensitive keywords', () => {
      const result = calculateSensitivityScore('这是一个spam测试')
      expect(result.score).toBeGreaterThanOrEqual(30)
      expect(result.flags.some((f) => f.includes('spam'))).toBe(true)
    })

    it('should detect Chinese sensitive words', () => {
      const result = calculateSensitivityScore('这里有赌博内容')
      expect(result.score).toBeGreaterThanOrEqual(30)
      expect(result.flags.some((f) => f.includes('赌博'))).toBe(true)
    })

    it('should detect multiple links', () => {
      const content = 'Check http://a.com http://b.com http://c.com http://d.com'
      const result = calculateSensitivityScore(content)
      expect(result.score).toBeGreaterThanOrEqual(20)
      expect(result.flags.some((f) => f.includes('链接'))).toBe(true)
    })

    it('should detect short content', () => {
      const result = calculateSensitivityScore('hi')
      expect(result.score).toBeGreaterThanOrEqual(10)
      expect(result.flags.some((f) => f.includes('过短'))).toBe(true)
    })

    it('should detect repeated characters', () => {
      const result = calculateSensitivityScore('aaaaa正常内容')
      expect(result.score).toBeGreaterThanOrEqual(15)
      expect(result.flags.some((f) => f.includes('重复字符'))).toBe(true)
    })

    it('should detect excessive uppercase', () => {
      const result = calculateSensitivityScore('THIS IS ALL CAPS WITH ENOUGH CHARS')
      expect(result.score).toBeGreaterThanOrEqual(10)
      expect(result.flags.some((f) => f.includes('大写'))).toBe(true)
    })

    it('should cap score at 100', () => {
      const result = calculateSensitivityScore(
        'spam 赌博 诈骗 暴力 色情 http://a.com http://b.com http://c.com http://d.com aaaaa',
      )
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should not go below 0', () => {
      const result = calculateSensitivityScore('ok')
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('should accumulate multiple flags', () => {
      const result = calculateSensitivityScore(
        'spam 赌博 aaaaa http://a.com http://b.com http://c.com http://d.com',
      )
      expect(result.flags.length).toBeGreaterThan(2)
    })
  })
})
