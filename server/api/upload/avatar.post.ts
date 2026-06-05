import { createError } from 'h3'
import formidable from 'formidable'
import { join } from 'node:path'
import { mkdir, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const form = formidable({
    maxFileSize: 2 * 1024 * 1024, // 2MB
    filter: ({ mimetype }) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      return allowedTypes.includes(mimetype || '')
    },
  })

  const [, files] = await form.parse(event.node.req)

  const file = files['avatar']?.[0]

  if (!file) {
    throw createError({
      statusCode: 400,
      message: '请选择图片文件',
    })
  }

  // 生成唯一文件名
  const ext = file.originalFilename?.split('.').pop() || 'jpg'
  const filename = `${auth.userId}-${Date.now()}.${ext}`

  // 确保目录存在 - 使用 .output/public 目录（生产模式静态文件目录）
  const uploadDir = join(process.cwd(), '.output', 'public', 'uploads', 'avatars')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // 移动文件
  const oldPath = file.filepath
  const newPath = join(uploadDir, filename)
  await rename(oldPath, newPath)

  // 返回文件 URL（使用 API 路由）
  const url = `/api/uploads/avatars/${filename}`

  return {
    code: 200,
    message: '头像上传成功',
    data: { url },
  }
})
