import { prisma } from '~/server/utils/prisma'
import { deletePostTranslation } from '~/server/utils/multi-language'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const slug = getRouterParam(event, 'slug')
  const language = getRouterParam(event, 'language')

  if (!language) {
    throw createError({
      statusCode: 400,
      message: '语言代码不能为空',
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

  // 只有作者或管理员可以删除翻译
  if (post.authorId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限',
    })
  }

  try {
    await deletePostTranslation(post.id, language)
    return { success: true }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : '删除失败',
    })
  }
})
