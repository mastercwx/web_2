import { prisma } from '~/server/utils/prisma'

/**
 * POST /api/reports
 * 提交举报
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const body = await readBody(event)
  const { targetType, targetId, reason, description } = body

  if (!targetType || !targetId || !reason) {
    throw createError({ statusCode: 400, message: '缺少必要字段' })
  }

  // 检查目标类型
  if (!['comment', 'post', 'user'].includes(targetType)) {
    throw createError({ statusCode: 400, message: '无效的举报类型' })
  }

  // 检查是否已经举报过
  const existingReport = await prisma.report.findFirst({
    where: {
      targetType,
      targetId: Number(targetId),
      reporterId: auth.id,
      status: 'pending',
    },
  })

  if (existingReport) {
    throw createError({ statusCode: 400, message: '您已经举报过此内容' })
  }

  // 检查目标是否存在
  if (targetType === 'comment') {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(targetId) },
    })
    if (!comment) {
      throw createError({ statusCode: 404, message: '评论不存在' })
    }
  }

  const report = await prisma.report.create({
    data: {
      targetType,
      targetId: Number(targetId),
      reason,
      description,
      reporterId: auth.id,
    },
  })

  return { data: { report, message: '举报已提交，管理员会尽快处理' } }
})
