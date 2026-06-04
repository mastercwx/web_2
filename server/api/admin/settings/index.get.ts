import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/admin/settings
 * 获取所有系统设置（仅管理员）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }
  if (auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '权限不足' })
  }

  const settings = await prisma.setting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  })

  // 按分组组织设置
  const grouped: Record<string, typeof settings> = {}
  for (const setting of settings) {
    if (!grouped[setting.group]) {
      grouped[setting.group] = []
    }
    grouped[setting.group]!.push(setting)
  }

  return {
    settings,
    grouped,
  }
})
