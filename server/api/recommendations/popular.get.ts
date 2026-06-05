/**
 * 获取热门文章 API
 * GET /api/recommendations/popular
 */

import { getPopularPosts } from '~/server/utils/recommendations'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 10, 50)
  const days = Math.min(Number(query.days) || 30, 365)

  const posts = await getPopularPosts(limit, days)

  return {
    success: true,
    data: posts,
  }
})
