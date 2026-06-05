/**
 * 获取 API 端点列表
 * GET /api/docs/endpoints
 */

import { getApiEndpointsByTag, searchApiEndpoints } from '~/server/utils/api-docs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search as string | undefined

  if (search) {
    const endpoints = searchApiEndpoints(search)
    return { endpoints }
  }

  const tags = getApiEndpointsByTag()
  return { tags }
})
