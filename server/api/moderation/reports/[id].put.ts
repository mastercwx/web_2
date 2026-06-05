import { prisma } from '~/server/utils/prisma'

/**
 * PUT /api/moderation/reports/:id
 * 处理举报
 */
export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '没有权限' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少举报ID' })
  }

  const body = await readBody(event)
  const { status, action } = body // status: resolved/dismissed, action: approve_comment/reject_comment/delete_comment

  if (!['resolved', 'dismissed'].includes(status)) {
    throw createError({ statusCode: 400, message: '无效的状态' })
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: { comment: true },
  })

  if (!report) {
    throw createError({ statusCode: 404, message: '举报不存在' })
  }

  // 如果有操作指令，执行相应操作
  if (action && report.comment) {
    switch (action) {
      case 'approve_comment':
        await prisma.comment.update({
          where: { id: report.targetId },
          data: { status: 'APPROVED' },
        })
        break
      case 'reject_comment':
        await prisma.comment.update({
          where: { id: report.targetId },
          data: { status: 'REJECTED' },
        })
        break
      case 'delete_comment':
        await prisma.comment.delete({
          where: { id: report.targetId },
        })
        break
    }
  }

  // 更新举报状态
  const updatedReport = await prisma.report.update({
    where: { id },
    data: {
      status,
      resolvedBy: auth.userId,
      resolvedAt: new Date(),
    },
  })

  return { data: { report: updatedReport } }
})
