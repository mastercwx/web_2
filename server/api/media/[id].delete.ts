import { createError } from 'h3'
import { join } from 'node:path'
import { unlink } from 'node:fs/promises'
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

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '无效的文件ID',
    })
  }

  // 查找文件
  const media = await prisma.media.findUnique({
    where: { id },
  })

  if (!media) {
    throw createError({
      statusCode: 404,
      message: '文件不存在',
    })
  }

  // 检查权限（只有上传者或管理员可以删除）
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  })

  if (media.uploaderId !== auth.userId && user?.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限删除此文件',
    })
  }

  // 删除物理文件
  const filePath = join(process.cwd(), 'public', media.url)
  if (existsSync(filePath)) {
    await unlink(filePath)
  }

  // 删除数据库记录
  await prisma.media.delete({
    where: { id },
  })

  return {
    code: 200,
    message: '文件已删除',
  }
})
