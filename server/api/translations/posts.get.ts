import { getPostsByLanguage, isValidLanguage } from '~/server/utils/multi-language'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const language = (query.language as string) || 'zh-CN'
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10

  if (!isValidLanguage(language)) {
    throw createError({
      statusCode: 400,
      message: '不支持的语言',
    })
  }

  const result = await getPostsByLanguage(language, { page, limit })

  return { data: result }
})
