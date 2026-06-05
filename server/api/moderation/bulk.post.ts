import { bulkModerate, logModerationAction } from '~/server/utils/content-moderation'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({ statusCode: 401, message: '未授权' })
  }

  const body = await readBody(event)
  const { items, action } = body

  if (!Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'items 数组是必需的',
    })
  }

  if (!action || !['approve', 'reject', 'delete'].includes(action)) {
    throw createError({
      statusCode: 400,
      message: 'action 必须是 approve、reject 或 delete',
    })
  }

  // 验证每个 item
  for (const item of items) {
    if (!item.id || !item.type || !['comment', 'report'].includes(item.type)) {
      throw createError({
        statusCode: 400,
        message: '每个 item 必须包含有效的 id 和 type',
      })
    }
  }

  const result = await bulkModerate(items, action, auth.userId)

  // 记录审核日志
  await logModerationAction(
    auth.userId,
    `bulk_${action}`,
    'multiple',
    0,
    `批量${action === 'approve' ? '批准' : action === 'reject' ? '拒绝' : '删除'} ${result.success} 个项目`,
  )

  return {
    code: 200,
    data: result,
  }
})
