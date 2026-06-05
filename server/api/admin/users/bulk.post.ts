import { bulkUpdateUsers } from '~/server/utils/user-management'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { userIds, action, role } = body

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'userIds array is required',
    })
  }

  if (!action) {
    throw createError({
      statusCode: 400,
      message: 'action is required',
    })
  }

  const validActions = ['ban', 'unban', 'activate', 'deactivate', 'delete', 'changeRole']
  if (!validActions.includes(action)) {
    throw createError({
      statusCode: 400,
      message: `Invalid action. Valid actions: ${validActions.join(', ')}`,
    })
  }

  if (action === 'changeRole' && !role) {
    throw createError({
      statusCode: 400,
      message: 'role is required for changeRole action',
    })
  }

  // 防止管理员删除自己
  const auth = event.context['auth']
  if (auth && action === 'delete' && userIds.includes(auth.userId)) {
    throw createError({
      statusCode: 400,
      message: 'Cannot delete your own account',
    })
  }

  const result = await bulkUpdateUsers(userIds, action, { role })

  return {
    code: 200,
    data: result,
  }
})
