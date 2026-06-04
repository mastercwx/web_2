import { prisma } from '~/server/utils/prisma'

interface CreateNotificationParams {
  userId: number
  type: 'like' | 'comment' | 'follow' | 'system'
  title: string
  content?: string
  link?: string
  actorId?: number
  postId?: number
}

// 创建通知
export async function createNotification(params: CreateNotificationParams) {
  try {
    // 不给自己发通知
    if (params.userId === params.actorId) {
      return null
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        link: params.link,
        actorId: params.actorId,
        postId: params.postId,
      },
    })

    return notification
  } catch (error) {
    console.error('创建通知失败:', error)
    return null
  }
}

// 获取未读通知数量
export async function getUnreadCount(userId: number) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
    return count
  } catch (error) {
    console.error('获取未读通知数量失败:', error)
    return 0
  }
}
