import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/settings/public
 * 获取公开的站点设置（无需登录）
 */
export default defineEventHandler(async () => {
  const publicKeys = [
    'site.name',
    'site.description',
    'site.keywords',
    'site.logo',
    'site.favicon',
    'social.github',
    'social.twitter',
    'social.email',
    'comment.enabled',
    'maintenance.enabled',
    'maintenance.message',
  ]

  const settings = await prisma.setting.findMany({
    where: {
      key: { in: publicKeys },
    },
  })

  // 转换为 key-value 对象
  const result: Record<string, string> = {}
  for (const setting of settings) {
    result[setting.key] = setting.value
  }

  return result
})
