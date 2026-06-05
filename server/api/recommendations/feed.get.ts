/**
 * 获取个性化推荐流 API
 * GET /api/recommendations/feed
 */

import { getPersonalizedFeed } from '~/server/utils/recommendations'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)

  // 尝试获取当前用户
  let userId: number | null = null
  try {
    const auth = event.context['auth']
    if (auth?.userId) {
      userId = auth.userId
    }
  } catch {
    // 未登录用户
  }

  const posts = await getPersonalizedFeed(userId, limit)

  return {
    success: true,
    data: posts,
  }
})
