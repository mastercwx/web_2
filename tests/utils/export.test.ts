import { describe, it, expect } from 'vitest'
import {
  jsonToCSV,
  formatDateForExport,
  formatUserForExport,
  formatPostForExport,
  formatCommentForExport,
  formatMediaForExport,
  generateExportFilename,
} from '~/server/utils/export'

describe('Export Utils', () => {
  describe('jsonToCSV', () => {
    it('should convert simple data to CSV', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ]
      const csv = jsonToCSV(data)
      expect(csv).toBe('name,age\nAlice,30\nBob,25')
    })

    it('should return empty string for empty data', () => {
      expect(jsonToCSV([])).toBe('')
    })

    it('should use custom columns', () => {
      const data = [{ name: 'Alice', age: 30, city: 'Beijing' }]
      const csv = jsonToCSV(data, ['name', 'city'])
      expect(csv).toBe('name,city\nAlice,Beijing')
    })

    it('should escape fields with commas', () => {
      const data = [{ name: 'Alice,Bob', age: 30 }]
      const csv = jsonToCSV(data)
      expect(csv).toBe('name,age\n"Alice,Bob",30')
    })

    it('should escape fields with double quotes', () => {
      const data = [{ name: 'Alice "Ali"', age: 30 }]
      const csv = jsonToCSV(data)
      expect(csv).toBe('name,age\n"Alice ""Ali""",30')
    })

    it('should handle null and undefined values', () => {
      const data = [{ name: 'Alice', age: null, city: undefined }]
      const csv = jsonToCSV(data)
      expect(csv).toBe('name,age,city\nAlice,,')
    })

    it('should stringify object values', () => {
      const data = [{ name: 'Alice', meta: { a: 1 } }]
      const csv = jsonToCSV(data)
      expect(csv).toContain('"{""a"":1}"')
    })
  })

  describe('formatDateForExport', () => {
    it('should format Date object', () => {
      const date = new Date('2026-06-04T12:30:45.000Z')
      const result = formatDateForExport(date)
      expect(result).toBe('2026-06-04 12:30:45')
    })

    it('should format date string', () => {
      const result = formatDateForExport('2026-06-04T12:30:45.000Z')
      expect(result).toBe('2026-06-04 12:30:45')
    })
  })

  describe('formatUserForExport', () => {
    it('should format user data', () => {
      const user = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      }
      const result = formatUserForExport(user)
      expect(result['ID']).toBe(1)
      expect(result['用户名']).toBe('alice')
      expect(result['邮箱']).toBe('alice@example.com')
      expect(result['邮箱验证']).toBe('是')
      expect(result['两步验证']).toBe('否')
    })
  })

  describe('formatPostForExport', () => {
    it('should format published post', () => {
      const post = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        author: { username: 'alice' },
        published: true,
        _count: { likes: 10, comments: 5, favorites: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }
      const result = formatPostForExport(post)
      expect(result['标题']).toBe('Test Post')
      expect(result['状态']).toBe('已发布')
      expect(result['点赞数']).toBe(10)
    })

    it('should format draft post', () => {
      const post = {
        id: 1,
        title: 'Draft',
        slug: 'draft',
        author: null,
        published: false,
        _count: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
      const result = formatPostForExport(post)
      expect(result['状态']).toBe('草稿')
      expect(result['作者']).toBe('')
    })
  })

  describe('formatCommentForExport', () => {
    it('should format comment data', () => {
      const comment = {
        id: 1,
        content: 'Great post!',
        user: { username: 'bob' },
        post: { title: 'Test Post' },
        status: 'approved',
        createdAt: '2026-01-01T00:00:00.000Z',
      }
      const result = formatCommentForExport(comment)
      expect(result['内容']).toBe('Great post!')
      expect(result['评论者']).toBe('bob')
      expect(result['文章标题']).toBe('Test Post')
    })
  })

  describe('formatMediaForExport', () => {
    it('should format media data', () => {
      const media = {
        id: 1,
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 1048576,
        folder: 'uploads',
        uploader: { username: 'alice' },
        createdAt: '2026-01-01T00:00:00.000Z',
      }
      const result = formatMediaForExport(media)
      expect(result['文件名']).toBe('photo.jpg')
      expect(result['类型']).toBe('image/jpeg')
      expect(result['大小']).toBe('1 MB')
    })
  })

  describe('generateExportFilename', () => {
    it('should generate filename with type and format', () => {
      const filename = generateExportFilename('users', 'csv')
      expect(filename).toMatch(/^hg-web-users-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
    })

    it('should use provided format', () => {
      const filename = generateExportFilename('posts', 'json')
      expect(filename).toMatch(/\.json$/)
    })
  })
})
