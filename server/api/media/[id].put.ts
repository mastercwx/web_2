import { createError } from 'h3'
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

  // 检查权限（只有上传者或管理员可以修改）
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  })

  if (media.uploaderId !== auth.userId && user?.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限修改此文件',
    })
  }

  const body = await readBody(event)

  // 更新文件信息
  const updated = await prisma.media.update({
    where: { id },
    data: {
      alt: body.alt ?? media.alt,
      caption: body.caption ?? media.caption,
      folder: body.folder ?? media.folder,
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
    message: '文件信息已更新',
    data: updated,
  }
})
