import { prisma } from '~/server/utils/prisma'
import { jsonToCSV, formatPostForExport, generateExportFilename } from '~/server/utils/export'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth

  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const query = getQuery(event)
  const format = (query.format as string) || 'json'

  // 获取文章数据
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          favorites: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 格式化数据
  const formattedPosts = posts.map(formatPostForExport)

  // 根据格式返回数据
  if (format === 'csv') {
    const csv = jsonToCSV(formattedPosts)
    const filename = generateExportFilename('posts', 'csv')

    setResponseHeaders(event, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    return '﻿' + csv
  }

  // JSON 格式
  const filename = generateExportFilename('posts', 'json')

  setResponseHeaders(event, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })

  return {
    exportTime: new Date().toISOString(),
    total: formattedPosts.length,
    data: formattedPosts,
  }
})
