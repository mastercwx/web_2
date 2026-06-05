import { getTranslationStats } from '~/server/utils/multi-language'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }

  const query = getQuery(event)
  const postId = query.postId ? Number(query.postId) : undefined

  const stats = await getTranslationStats(postId)

  return { data: stats }
})
