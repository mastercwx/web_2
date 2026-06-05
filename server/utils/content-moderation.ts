import { prisma } from '~/server/utils/prisma'

export interface ModerationRule {
  id: number
  name: string
  type: 'keyword' | 'pattern' | 'length' | 'link'
  pattern: string
  action: 'flag' | 'reject' | 'delete'
  isActive: boolean
  priority: number
}

export interface ModerationQueueItem {
  id: number
  type: 'comment' | 'post' | 'report'
  content: string
  author: {
    id: number
    username: string
    avatar: string | null
  }
  status: string
  createdAt: Date
  metadata: Record<string, unknown>
  sensitivityScore: number
  flags: string[]
}

export interface ModerationStats {
  totalComments: number
  pendingComments: number
  approvedComments: number
  rejectedComments: number
  totalReports: number
  pendingReports: number
  resolvedReports: number
  dismissedReports: number
  averageResponseTime: number
  topReportReasons: Array<{ reason: string; count: number }>
  moderationActivity: Array<{ date: string; count: number }>
  autoModeratedCount: number
}

export interface BulkModerationResult {
  success: number
  failed: number
  errors: string[]
}

// 敏感词库（示例）
const SENSITIVE_KEYWORDS = [
  'spam',
  '广告',
  '代购',
  '刷单',
  '赌博',
  '色情',
  '暴力',
  '恐怖',
  '诈骗',
  '钓鱼',
  '恶意软件',
]

// 链接正则
const URL_REGEX = /https?:\/\/\S+/gi

// 计算内容敏感度分数
export function calculateSensitivityScore(content: string): { score: number; flags: string[] } {
  let score = 0
  const flags: string[] = []

  // 检查敏感词
  const lowerContent = content.toLowerCase()
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      score += 30
      flags.push(`敏感词: ${keyword}`)
    }
  }

  // 检查链接数量
  const urls = content.match(URL_REGEX) || []
  if (urls.length > 3) {
    score += 20
    flags.push(`包含 ${urls.length} 个链接`)
  } else if (urls.length > 0) {
    score += 5
  }

  // 检查内容长度
  if (content.length < 5) {
    score += 10
    flags.push('内容过短')
  }

  // 检查重复字符
  const重复字符 = content.match(/(.)\1{4,}/g)
  if (重复字符) {
    score += 15
    flags.push('包含重复字符')
  }

  // 检查大写字母比例
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (upperCaseRatio > 0.7 && content.length > 10) {
    score += 10
    flags.push('大写字母过多')
  }

  // 限制分数范围
  score = Math.min(100, Math.max(0, score))

  return { score, flags }
}

// 自动审核内容
export async function autoModerateContent(
  content: string,
  _type: 'comment' | 'post',
): Promise<{ approved: boolean; reason?: string }> {
  const { score } = calculateSensitivityScore(content)

  // 获取自动审核规则
  const rules = await getActiveModerationRules()

  for (const rule of rules) {
    let matches = false

    switch (rule.type) {
      case 'keyword':
        matches = content.toLowerCase().includes(rule.pattern.toLowerCase())
        break
      case 'pattern':
        try {
          const regex = new RegExp(rule.pattern, 'i')
          matches = regex.test(content)
        } catch {
          // 无效正则，跳过
        }
        break
      case 'length':
        matches = content.length < Number.parseInt(rule.pattern)
        break
      case 'link':
        matches = URL_REGEX.test(content)
        break
    }

    if (matches) {
      if (rule.action === 'reject') {
        return { approved: false, reason: `触发规则: ${rule.name}` }
      }
      if (rule.action === 'delete') {
        return { approved: false, reason: `触发规则: ${rule.name}（自动删除）` }
      }
    }
  }

  // 基于敏感度分数判断
  if (score >= 70) {
    return { approved: false, reason: '内容敏感度过高' }
  }

  return { approved: true }
}

// 获取活跃的审核规则
export async function getActiveModerationRules(): Promise<ModerationRule[]> {
  // 这里可以从数据库获取规则，目前返回默认规则
  return [
    {
      id: 1,
      name: '垃圾内容检测',
      type: 'keyword',
      pattern: 'spam|垃圾|广告',
      action: 'flag',
      isActive: true,
      priority: 1,
    },
    {
      id: 2,
      name: '短内容检测',
      type: 'length',
      pattern: '3',
      action: 'flag',
      isActive: true,
      priority: 2,
    },
    {
      id: 3,
      name: '链接检测',
      type: 'link',
      pattern: 'http',
      action: 'flag',
      isActive: true,
      priority: 3,
    },
  ]
}

// 获取审核队列
export async function getModerationQueue(
  type: 'all' | 'comments' | 'posts' | 'reports' = 'all',
  status: string = 'PENDING',
  page: number = 1,
  pageSize: number = 20,
): Promise<{ items: ModerationQueueItem[]; total: number; totalPages: number }> {
  const items: ModerationQueueItem[] = []
  let total = 0

  // 获取待审核评论
  if (type === 'all' || type === 'comments') {
    const commentWhere: any = {}
    if (status !== 'ALL') {
      commentWhere.status = status
    }

    const [comments, commentCount] = await Promise.all([
      prisma.comment.findMany({
        where: commentWhere,
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          post: {
            select: { id: true, title: true },
          },
          _count: {
            select: { reports: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'comments' ? (page - 1) * pageSize : 0,
        take: type === 'comments' ? pageSize : 10,
      }),
      prisma.comment.count({ where: commentWhere }),
    ])

    for (const comment of comments) {
      const { score, flags } = calculateSensitivityScore(comment.content)
      items.push({
        id: comment.id,
        type: 'comment',
        content: comment.content,
        author: comment.author,
        status: comment.status,
        createdAt: comment.createdAt,
        metadata: {
          postId: comment.postId,
          postTitle: comment.post.title,
          reportCount: comment._count.reports,
        },
        sensitivityScore: score,
        flags,
      })
    }

    if (type === 'comments') {
      total = commentCount
    }
  }

  // 获取待处理举报
  if (type === 'all' || type === 'reports') {
    const reportWhere: any = {}
    if (status !== 'ALL') {
      reportWhere.status = status.toLowerCase()
    }

    const [reports, reportCount] = await Promise.all([
      prisma.report.findMany({
        where: reportWhere,
        include: {
          reporter: {
            select: { id: true, username: true, avatar: true },
          },
          comment: {
            include: {
              author: {
                select: { id: true, username: true, avatar: true },
              },
              post: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'reports' ? (page - 1) * pageSize : 0,
        take: type === 'reports' ? pageSize : 10,
      }),
      prisma.report.count({ where: reportWhere }),
    ])

    for (const report of reports) {
      const content = report.comment?.content || report.description || ''
      const { score, flags } = calculateSensitivityScore(content)

      items.push({
        id: report.id,
        type: 'report',
        content: content,
        author: report.reporter,
        status: report.status,
        createdAt: report.createdAt,
        metadata: {
          reason: report.reason,
          description: report.description,
          targetType: report.targetType,
          targetId: report.targetId,
          commentAuthor: report.comment?.author,
          postTitle: report.comment?.post?.title,
        },
        sensitivityScore: score,
        flags: [...flags, `举报原因: ${report.reason}`],
      })
    }

    if (type === 'reports') {
      total = reportCount
    }
  }

  // 综合排序：敏感度高的优先
  items.sort((a, b) => b.sensitivityScore - a.sensitivityScore)

  if (type === 'all') {
    total = items.length
  }

  const totalPages = Math.ceil(total / pageSize)

  return {
    items: type === 'all' ? items.slice(0, pageSize) : items,
    total,
    totalPages,
  }
}

// 批量审核操作
export async function bulkModerate(
  items: Array<{ id: number; type: 'comment' | 'report' }>,
  action: 'approve' | 'reject' | 'delete',
  moderatorId: number,
): Promise<BulkModerationResult> {
  const result: BulkModerationResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  for (const item of items) {
    try {
      if (item.type === 'comment') {
        switch (action) {
          case 'approve':
            await prisma.comment.update({
              where: { id: item.id },
              data: { status: 'APPROVED' },
            })
            break
          case 'reject':
            await prisma.comment.update({
              where: { id: item.id },
              data: { status: 'REJECTED' },
            })
            break
          case 'delete':
            await prisma.comment.delete({
              where: { id: item.id },
            })
            break
        }
      } else if (item.type === 'report') {
        await prisma.report.update({
          where: { id: item.id },
          data: {
            status: action === 'approve' ? 'resolved' : 'dismissed',
            resolvedBy: moderatorId,
            resolvedAt: new Date(),
          },
        })
      }
      result.success++
    } catch (error: any) {
      result.failed++
      result.errors.push(`${item.type} ${item.id}: ${error.message}`)
    }
  }

  return result
}

// 获取审核统计
export async function getModerationStats(): Promise<ModerationStats> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalComments,
    pendingComments,
    approvedComments,
    rejectedComments,
    totalReports,
    pendingReports,
    resolvedReports,
    dismissedReports,
    recentResolvedReports,
    topReportReasons,
    dailyActivity,
  ] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count({ where: { status: 'REJECTED' } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.report.count({ where: { status: 'resolved' } }),
    prisma.report.count({ where: { status: 'dismissed' } }),
    prisma.report.findMany({
      where: {
        status: { in: ['resolved', 'dismissed'] },
        resolvedAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    }),
    prisma.report.groupBy({
      by: ['reason'],
      _count: true,
      orderBy: { _count: { reason: 'desc' } },
      take: 10,
    }),
    prisma.report.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
    }),
  ])

  // 计算平均响应时间（小时）
  let averageResponseTime = 0
  if (recentResolvedReports.length > 0) {
    const totalResponseTime = recentResolvedReports.reduce((sum, report) => {
      if (report.resolvedAt) {
        return sum + (report.resolvedAt.getTime() - report.createdAt.getTime())
      }
      return sum
    }, 0)
    averageResponseTime =
      Math.round((totalResponseTime / recentResolvedReports.length / (1000 * 60 * 60)) * 10) / 10
  }

  // 按日期统计活动
  const activityMap = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    activityMap.set(dateStr, 0)
  }

  for (const report of dailyActivity) {
    const dateStr = report.createdAt.toISOString().split('T')[0]
    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
  }

  const moderationActivity = Array.from(activityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .reverse()

  return {
    totalComments,
    pendingComments,
    approvedComments,
    rejectedComments,
    totalReports,
    pendingReports,
    resolvedReports,
    dismissedReports,
    averageResponseTime,
    topReportReasons: topReportReasons.map((r) => ({
      reason: r.reason,
      count: r._count,
    })),
    moderationActivity,
    autoModeratedCount: 0, // 可以从日志中统计
  }
}

// 记录审核日志
export async function logModerationAction(
  moderatorId: number,
  action: string,
  targetType: string,
  targetId: number,
  details?: string,
) {
  await prisma.activityLog.create({
    data: {
      userId: moderatorId,
      action: `moderation_${action}`,
      details: JSON.stringify({
        targetType,
        targetId,
        details,
      }),
      ipAddress: '127.0.0.1', // 可以从请求中获取
    },
  })
}
