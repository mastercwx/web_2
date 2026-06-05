import { describe, it, expect } from 'vitest'
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageInfo,
  isValidLanguage,
} from '~/server/utils/multi-language'

describe('Multi-Language Utils', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('should have at least 3 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(3)
    })

    it('should include zh-CN', () => {
      const zh = SUPPORTED_LANGUAGES.find((l) => l.code === 'zh-CN')
      expect(zh).toBeDefined()
      expect(zh!.name).toBe('简体中文')
    })

    it('should include en', () => {
      const en = SUPPORTED_LANGUAGES.find((l) => l.code === 'en')
      expect(en).toBeDefined()
    })
  })

  describe('DEFAULT_LANGUAGE', () => {
    it('should be zh-CN', () => {
      expect(DEFAULT_LANGUAGE).toBe('zh-CN')
    })
  })

  describe('getLanguageInfo', () => {
    it('should return info for valid code', () => {
      const info = getLanguageInfo('zh-CN')
      expect(info).toBeDefined()
      expect(info!.code).toBe('zh-CN')
      expect(info!.nativeName).toBe('简体中文')
    })

    it('should return undefined for invalid code', () => {
      expect(getLanguageInfo('fr')).toBeUndefined()
    })
  })

  describe('isValidLanguage', () => {
    it('should return true for valid language codes', () => {
      expect(isValidLanguage('zh-CN')).toBe(true)
      expect(isValidLanguage('en')).toBe(true)
    })

    it('should return false for invalid language codes', () => {
      expect(isValidLanguage('fr')).toBe(false)
      expect(isValidLanguage('')).toBe(false)
      expect(isValidLanguage('zh_CN')).toBe(false)
    })
  })
})
