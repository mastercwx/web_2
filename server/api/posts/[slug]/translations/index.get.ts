import { prisma } from '~/server/utils/prisma'
import { getPostTranslations } from '~/server/utils/multi-language'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  const translations = await getPostTranslations(post.id)

  return { data: translations }
})
