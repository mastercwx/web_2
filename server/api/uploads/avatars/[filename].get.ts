import { createError, sendStream } from 'h3'
import { join } from 'node:path'
import { existsSync, createReadStream } from 'node:fs'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')

  if (!filename || filename.includes('..') || filename.includes('/')) {
    throw createError({
      statusCode: 400,
      message: '无效的文件名',
    })
  }

  // 检查多个可能的路径
  const possiblePaths = [
    join(process.cwd(), '.output', 'public', 'uploads', 'avatars', filename),
    join(process.cwd(), 'public', 'uploads', 'avatars', filename),
  ]

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      // 设置正确的 Content-Type
      const ext = filename.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      }

      setResponseHeader(event, 'Content-Type', mimeTypes[ext || ''] || 'application/octet-stream')
      setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')

      return sendStream(event, createReadStream(filePath))
    }
  }

  throw createError({
    statusCode: 404,
    message: '文件不存在',
  })
})
