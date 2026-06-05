import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { upsertPostTranslation, SUPPORTED_LANGUAGES } from '~/server/utils/multi-language'

const translationSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES.map((l) => l.code) as [string, ...string[]]),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)

  const result = translationSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '参数错误',
      data: result.error.issues,
    })
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 只有作者或管理员可以添加翻译
  if (post.authorId !== auth.id && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限',
    })
  }

  const translation = await upsertPostTranslation(post.id, result.data.language, {
    title: result.data.title,
    content: result.data.content,
    excerpt: result.data.excerpt,
  })

  return { data: translation }
})
