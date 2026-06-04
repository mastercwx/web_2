import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const limit = Number(query.limit) || 20

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: '缺少用户ID',
    })
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 获取用户活动日志
  const activities = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      details: true,
      createdAt: true,
    },
  })

  // 格式化活动描述
  const formattedActivities = activities.map((activity) => {
    let description = ''
    let icon = ''
    let link = ''

    switch (activity.action) {
      case 'login':
        description = '登录了系统'
        icon = '🔑'
        break
      case 'register':
        description = '注册了账号'
        icon = '✨'
        break
      case 'create_post':
        description = '发布了新文章'
        icon = '📝'
        link = `/posts/${activity.entityId}`
        break
      case 'update_post':
        description = '更新了文章'
        icon = '✏️'
        link = `/posts/${activity.entityId}`
        break
      case 'delete_post':
        description = '删除了文章'
        icon = '🗑️'
        break
      case 'create_comment':
        description = '发表了评论'
        icon = '💬'
        break
      case 'like_post':
        description = '点赞了文章'
        icon = '❤️'
        break
      case 'follow_user':
        description = '关注了用户'
        icon = '👤'
        break
      case 'toggle_2fa':
        description = activity.details || '更新了两步验证设置'
        icon = '🔐'
        break
      default:
        description = activity.details || `执行了 ${activity.action} 操作`
        icon = '📌'
    }

    return {
      id: activity.id,
      action: activity.action,
      description,
      icon,
      link,
      createdAt: activity.createdAt,
    }
  })

  return {
    code: 200,
    data: { activities: formattedActivities },
  }
})
