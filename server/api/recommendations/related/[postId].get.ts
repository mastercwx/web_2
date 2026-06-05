/**
 * 获取相关文章推荐 API
 * GET /api/recommendations/related/:postId
 */

import { getContentBasedRecommendations } from '~/server/utils/recommendations'

export default defineEventHandler(async (event) => {
  const postId = Number(getRouterParam(event, 'postId'))
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 5, 20)

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章 ID',
    })
  }

  const posts = await getContentBasedRecommendations(postId, limit)

  return {
    success: true,
    data: posts,
  }
})
