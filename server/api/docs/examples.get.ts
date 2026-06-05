/**
 * 获取 API 示例代码
 * GET /api/docs/examples
 */

import {
  getApiEndpointDetail,
  generateCurlExample,
  generateFetchExample,
} from '~/server/utils/api-docs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = query.path as string
  const method = query.method as string

  if (!path || !method) {
    throw createError({
      statusCode: 400,
      message: '请提供 path 和 method 参数',
    })
  }

  const endpoint = getApiEndpointDetail(path, method)

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      message: '未找到指定的 API 端点',
    })
  }

  return {
    curl: generateCurlExample(endpoint),
    fetch: generateFetchExample(endpoint),
  }
})
