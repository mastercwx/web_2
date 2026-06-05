import { calculateSensitivityScore } from '~/server/utils/content-moderation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { content } = body

  if (!content || typeof content !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'content 字符串是必需的',
    })
  }

  const result = calculateSensitivityScore(content)

  return {
    code: 200,
    data: result,
  }
})
