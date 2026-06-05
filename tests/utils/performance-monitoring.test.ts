import { describe, it, expect } from 'vitest'
import { formatBytes, formatDuration, getAlertConfigs } from '~/server/utils/performance-monitoring'

describe('Performance Monitoring Utils', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB')
    })

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB')
    })
  })

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(30)).toBe('30秒')
    })

    it('should format minutes', () => {
      expect(formatDuration(120)).toBe('2分钟')
    })

    it('should format hours', () => {
      expect(formatDuration(7200)).toBe('2小时')
    })

    it('should format days', () => {
      expect(formatDuration(172800)).toBe('2天')
    })

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0秒')
    })
  })

  describe('getAlertConfigs', () => {
    it('should return an array of alert configs', () => {
      const configs = getAlertConfigs()
      expect(Array.isArray(configs)).toBe(true)
      expect(configs.length).toBeGreaterThan(0)
    })

    it('each config should have required fields', () => {
      const configs = getAlertConfigs()
      for (const config of configs) {
        expect(config).toHaveProperty('id')
        expect(config).toHaveProperty('metric')
        expect(config).toHaveProperty('threshold')
        expect(config).toHaveProperty('condition')
        expect(config).toHaveProperty('severity')
        expect(config).toHaveProperty('enabled')
        expect(config).toHaveProperty('message')
      }
    })
  })
})
