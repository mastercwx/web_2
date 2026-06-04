import { prisma } from '~/server/utils/prisma'
import { jsonToCSV, formatCommentForExport, generateExportFilename } from '~/server/utils/export'

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

  // 获取评论数据
  const comments = await prisma.comment.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
      post: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 格式化数据
  const formattedComments = comments.map(formatCommentForExport)

  // 根据格式返回数据
  if (format === 'csv') {
    const csv = jsonToCSV(formattedComments)
    const filename = generateExportFilename('comments', 'csv')

    setResponseHeaders(event, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    return '﻿' + csv
  }

  // JSON 格式
  const filename = generateExportFilename('comments', 'json')

  setResponseHeaders(event, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })

  return {
    exportTime: new Date().toISOString(),
    total: formattedComments.length,
    data: formattedComments,
  }
})
