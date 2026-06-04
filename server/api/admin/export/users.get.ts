import { prisma } from '~/server/utils/prisma'
import { jsonToCSV, formatUserForExport, generateExportFilename } from '~/server/utils/export'

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

  // 获取用户数据
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // 格式化数据
  const formattedUsers = users.map(formatUserForExport)

  // 根据格式返回数据
  if (format === 'csv') {
    const csv = jsonToCSV(formattedUsers)
    const filename = generateExportFilename('users', 'csv')

    setResponseHeaders(event, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    // 添加 BOM 以支持 Excel 打开中文
    return '﻿' + csv
  }

  // JSON 格式
  const filename = generateExportFilename('users', 'json')

  setResponseHeaders(event, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })

  return {
    exportTime: new Date().toISOString(),
    total: formattedUsers.length,
    data: formattedUsers,
  }
})
