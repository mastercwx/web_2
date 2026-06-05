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
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filter: ({ mimetype }) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      return allowedTypes.includes(mimetype || '')
    },
  })

  const [, files] = await form.parse(event.node.req)

  const file = files['image']?.[0]

  if (!file) {
    throw createError({
      statusCode: 400,
      message: '请选择图片文件',
    })
  }

  // 生成唯一文件名
  const ext = file.originalFilename?.split('.').pop() || 'jpg'
  const filename = `${auth.userId}-${Date.now()}.${ext}`

  // 确保目录存在
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'images')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // 移动文件
  const oldPath = file.filepath
  const newPath = join(uploadDir, filename)
  await rename(oldPath, newPath)

  // 文件 URL
  const url = `/uploads/images/${filename}`

  // 保存到媒体库
  await prisma.media.create({
    data: {
      filename,
      originalName: file.originalFilename || 'unknown',
      mimeType: file.mimetype || 'image/jpeg',
      size: file.size,
      url,
      folder: 'uploads/images',
      uploaderId: auth.userId,
    },
  })

  return {
    code: 200,
    message: '图片上传成功',
    data: { url },
  }
})
