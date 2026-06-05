/**
 * 获取 OpenAPI 规范
 * GET /api/docs/openapi
 */

import { generateOpenApiSpec } from '~/server/utils/api-docs'

export default defineEventHandler(async () => {
  return generateOpenApiSpec()
})
