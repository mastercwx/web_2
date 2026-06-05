import { prisma } from '~/server/utils/prisma'

// 活动类型常量
export const ActivityActions = {
  // 认证相关
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFY: 'email_verify',

  // 文章相关
  POST_CREATE: 'post_create',
  POST_UPDATE: 'post_update',
  POST_DELETE: 'post_delete',
  POST_PUBLISH: 'post_publish',
  POST_ARCHIVE: 'post_archive',

  // 评论相关
  COMMENT_CREATE: 'comment_create',
  COMMENT_UPDATE: 'comment_update',
  COMMENT_DELETE: 'comment_delete',

  // 用户操作
  LIKE: 'like',
  UNLIKE: 'unlike',
  FAVORITE: 'favorite',
  UNFAVORITE: 'unfavorite',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',

  // 管理操作
  USER_BAN: 'user_ban',
  USER_UNBAN: 'user_unban',
  USER_ROLE_CHANGE: 'user_role_change',
  SETTINGS_UPDATE: 'settings_update',

  // 媒体操作
  MEDIA_UPLOAD: 'media_upload',
  MEDIA_DELETE: 'media_delete',
} as const

export type ActivityAction = (typeof ActivityActions)[keyof typeof ActivityActions]

// 实体类型
export const EntityTypes = {
  USER: 'user',
  POST: 'post',
  COMMENT: 'comment',
  MEDIA: 'media',
  SETTINGS: 'settings',
} as const

export type EntityType = (typeof EntityTypes)[keyof typeof EntityTypes]

interface LogActivityOptions {
  userId?: number | null
  action: ActivityAction
  entity?: EntityType
  entityId?: number
  details?: string
  ipAddress?: string
  userAgent?: string
}

// 记录活动日志
export async function logActivity(options: LogActivityOptions): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entity: options.entity || null,
        entityId: options.entityId || null,
        details: options.details || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    })
  } catch (error) {
    // 日志记录失败不应影响主业务逻辑
    console.error('Failed to log activity:', error)
  }
}

// 从 H3 事件中提取请求信息并记录活动
export async function logActivityFromEvent(
  event: any,
  action: ActivityAction,
  options?: {
    entity?: EntityType
    entityId?: number
    details?: string
  },
): Promise<void> {
  const auth = event.context.auth
  const headers = event.node.req.headers

  await logActivity({
    userId: auth?.userId || null,
    action,
    entity: options?.entity,
    entityId: options?.entityId,
    details: options?.details,
    ipAddress:
      (headers['x-forwarded-for'] as string) ||
      (headers['x-real-ip'] as string) ||
      event.node.req.socket.remoteAddress,
    userAgent: headers['user-agent'] as string,
  })
}
