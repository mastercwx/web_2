import { createError } from 'h3'
import formidable from 'formidable'
import { join } from 'node:path'
import { mkdir, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    filter: ({ mimetype }) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'application/pdf',
      ]
      return allowedTypes.includes(mimetype || '')
    },
  })

  const [fields, files] = await form.parse(event.node.req)

  const file = files['file']?.[0]

  if (!file) {
    throw createError({
      statusCode: 400,
      message: '请选择文件',
    })
  }

  // 获取额外字段
  const alt = fields['alt']?.[0] || ''
  const caption = fields['caption']?.[0] || ''
  const folder = fields['folder']?.[0] || 'uploads'

  // 生成唯一文件名
  const ext = file.originalFilename?.split('.').pop() || 'bin'
  const filename = `${auth.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  // 确保目录存在
  const uploadDir = join(process.cwd(), 'public', folder)
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // 移动文件
  const oldPath = file.filepath
  const newPath = join(uploadDir, filename)
  await rename(oldPath, newPath)

  // 文件 URL
  const url = `/${folder}/${filename}`

  // 保存到数据库
  const media = await prisma.media.create({
    data: {
      filename,
      originalName: file.originalFilename || 'unknown',
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      url,
      alt,
      caption,
      folder,
      uploaderId: auth.userId,
    },
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  return {
    code: 200,
    message: '文件上传成功',
    data: media,
  }
})
