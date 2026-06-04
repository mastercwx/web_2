import { prisma } from '~/server/utils/prisma'

/**
 * PUT /api/admin/settings
 * 批量更新系统设置（仅管理员）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }
  if (auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const body = await readBody(event)
  const { settings } = body

  if (!settings || !Array.isArray(settings)) {
    throw createError({ statusCode: 400, message: '无效的设置数据' })
  }

  const results = []
  for (const item of settings) {
    const { key, value } = item
    if (!key) continue

    const result = await prisma.setting.update({
      where: { key },
      data: { value: String(value ?? '') },
    })
    results.push(result)
  }

  return {
    message: `已更新 ${results.length} 个设置`,
    count: results.length,
  }
})
