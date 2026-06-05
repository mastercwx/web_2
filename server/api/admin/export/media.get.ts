import { prisma } from '~/server/utils/prisma'
import { jsonToCSV, formatMediaForExport, generateExportFilename } from '~/server/utils/export'

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

  // 获取媒体数据
  const media = await prisma.media.findMany({
    include: {
      uploader: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 格式化数据
  const formattedMedia = media.map(formatMediaForExport)

  // 根据格式返回数据
  if (format === 'csv') {
    const csv = jsonToCSV(formattedMedia)
    const filename = generateExportFilename('media', 'csv')

    setResponseHeaders(event, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    return '﻿' + csv
  }

  // JSON 格式
  const filename = generateExportFilename('media', 'json')

  setResponseHeaders(event, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })

  return {
    exportTime: new Date().toISOString(),
    total: formattedMedia.length,
    data: formattedMedia,
  }
})
