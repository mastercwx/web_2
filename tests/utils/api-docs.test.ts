import { describe, it, expect } from 'vitest'
import {
  getApiDocsConfig,
  getAllApiEndpoints,
  getApiEndpointsByTag,
  searchApiEndpoints,
  getApiEndpointDetail,
  generateCurlExample,
  generateFetchExample,
  generateOpenApiSpec,
} from '~/server/utils/api-docs'

describe('API Docs Utils', () => {
  describe('getApiDocsConfig', () => {
    it('should return config with title and version', () => {
      const config = getApiDocsConfig()
      expect(config.title).toBeTruthy()
      expect(config.version).toBeTruthy()
      expect(config.baseUrl).toBeTruthy()
    })
  })

  describe('getAllApiEndpoints', () => {
    it('should return a non-empty array', () => {
      const endpoints = getAllApiEndpoints()
      expect(Array.isArray(endpoints)).toBe(true)
      expect(endpoints.length).toBeGreaterThan(0)
    })

    it('each endpoint should have required fields', () => {
      const endpoints = getAllApiEndpoints()
      for (const ep of endpoints) {
        expect(ep).toHaveProperty('path')
        expect(ep).toHaveProperty('method')
        expect(ep).toHaveProperty('summary')
        expect(typeof ep.path).toBe('string')
        expect(typeof ep.method).toBe('string')
      }
    })
  })

  describe('getApiEndpointsByTag', () => {
    it('should return tags with endpoints', () => {
      const tags = getApiEndpointsByTag()
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBeGreaterThan(0)
      for (const tag of tags) {
        expect(tag).toHaveProperty('name')
        expect(tag).toHaveProperty('endpoints')
        expect(Array.isArray(tag.endpoints)).toBe(true)
      }
    })
  })

  describe('searchApiEndpoints', () => {
    it('should find endpoints by keyword', () => {
      const results = searchApiEndpoints('post')
      expect(results.length).toBeGreaterThan(0)
      for (const ep of results) {
        const match =
          ep.path.toLowerCase().includes('post') ||
          ep.summary.toLowerCase().includes('post') ||
          ep.description?.toLowerCase().includes('post')
        expect(match).toBe(true)
      }
    })

    it('should return empty for no match', () => {
      const results = searchApiEndpoints('zzzznonexistent')
      expect(results).toHaveLength(0)
    })

    it('should be case-insensitive', () => {
      const upper = searchApiEndpoints('POST')
      const lower = searchApiEndpoints('post')
      expect(upper.length).toBe(lower.length)
    })
  })

  describe('getApiEndpointDetail', () => {
    it('should return endpoint for valid path and method', () => {
      const endpoints = getAllApiEndpoints()
      const first = endpoints[0]
      if (!first) return
      const detail = getApiEndpointDetail(first.path, first.method)
      expect(detail).toBeDefined()
      expect(detail!.path).toBe(first.path)
    })

    it('should return null for invalid path', () => {
      const detail = getApiEndpointDetail('/nonexistent', 'GET')
      expect(detail).toBeNull()
    })
  })

  describe('generateCurlExample', () => {
    it('should generate a curl command', () => {
      const endpoints = getAllApiEndpoints()
      const ep = endpoints[0]
      if (!ep) return
      const curl = generateCurlExample(ep)
      expect(curl).toContain('curl')
      expect(curl).toContain(ep.path)
    })
  })

  describe('generateFetchExample', () => {
    it('should generate a fetch snippet', () => {
      const endpoints = getAllApiEndpoints()
      const ep = endpoints[0]
      if (!ep) return
      const fetch = generateFetchExample(ep)
      expect(fetch).toContain('fetch')
      expect(fetch).toContain(ep.path)
    })
  })

  describe('generateOpenApiSpec', () => {
    it('should generate valid OpenAPI spec', () => {
      const spec = generateOpenApiSpec()
      expect(spec).toHaveProperty('openapi')
      expect(spec).toHaveProperty('info')
      expect(spec).toHaveProperty('paths')
      expect((spec as any).openapi).toMatch(/^3\./)
    })
  })
})
