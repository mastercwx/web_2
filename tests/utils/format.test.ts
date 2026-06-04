import { describe, it, expect } from 'vitest'
import { formatDate, formatFileSize, formatNumber } from '~/utils/format'

describe('formatDate', () => {
  it('should format date with default format', () => {
    const date = new Date('2026-06-04T12:30:45')
    expect(formatDate(date)).toBe('2026-06-04')
  })

  it('should format date with custom format', () => {
    const date = new Date('2026-06-04T12:30:45')
    expect(formatDate(date, 'YYYY/MM/DD HH:mm:ss')).toBe('2026/06/04 12:30:45')
  })

  it('should handle string date input', () => {
    expect(formatDate('2026-06-04')).toBe('2026-06-04')
  })
})

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
  })

  it('should format with decimals', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
})

describe('formatNumber', () => {
  it('should add thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
  })

  it('should handle small numbers', () => {
    expect(formatNumber(999)).toBe('999')
  })
})
