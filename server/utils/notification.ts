import { prisma } from '~/server/utils/prisma'
import {
  sendEmail,
  getCommentNotificationTemplate,
  getLikeNotificationTemplate,
  getFollowNotificationTemplate,
} from '~/server/utils/email'

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

    // 异步发送邮件通知
    sendEmailNotification(params).catch((err) =>
      console.error('Failed to send email notification:', err),
    )

    return notification
  } catch (error) {
    console.error('创建通知失败:', error)
    return null
  }
}

// 发送邮件通知
async function sendEmailNotification(params: CreateNotificationParams) {
  try {
    // 获取接收者信息
    const recipient = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        email: true,
        username: true,
        emailNotifications: true,
        emailVerified: true,
      },
    })

    // 检查是否启用了邮件通知且邮箱已验证
    if (!recipient || !recipient.emailNotifications || !recipient.emailVerified) {
      return
    }

    const appUrl = process.env['APP_URL'] || 'http://localhost:3000'

    // 获取发送者信息
    let actorUsername = '用户'
    if (params.actorId) {
      const actor = await prisma.user.findUnique({
        where: { id: params.actorId },
        select: { username: true },
      })
      if (actor) {
        actorUsername = actor.username
      }
    }

    // 根据通知类型发送不同邮件
    switch (params.type) {
      case 'comment':
        if (params.postId) {
          const post = await prisma.post.findUnique({
            where: { id: params.postId },
            select: { title: true, slug: true },
          })
          if (post) {
            await sendEmail({
              to: recipient.email,
              subject: `【HG Web】${actorUsername} 评论了你的文章`,
              html: getCommentNotificationTemplate(
                recipient.username,
                actorUsername,
                post.title,
                params.content || '',
                `${appUrl}/posts/${post.slug}`,
              ),
            })
          }
        }
        break

      case 'like':
        if (params.postId) {
          const post = await prisma.post.findUnique({
            where: { id: params.postId },
            select: { title: true, slug: true },
          })
          if (post) {
            await sendEmail({
              to: recipient.email,
              subject: `【HG Web】${actorUsername} 赞了你的文章`,
              html: getLikeNotificationTemplate(
                recipient.username,
                actorUsername,
                post.title,
                `${appUrl}/posts/${post.slug}`,
              ),
            })
          }
        }
        break

      case 'follow':
        await sendEmail({
          to: recipient.email,
          subject: `【HG Web】${actorUsername} 关注了你`,
          html: getFollowNotificationTemplate(
            recipient.username,
            actorUsername,
            `${appUrl}/users/${params.actorId}`,
          ),
        })
        break
    }
  } catch (error) {
    console.error('发送邮件通知失败:', error)
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
