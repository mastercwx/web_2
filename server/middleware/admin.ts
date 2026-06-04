export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // 只处理管理后台 API
  if (!path.startsWith('/api/admin/')) {
    return
  }

  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有管理员权限',
    })
  }
})
