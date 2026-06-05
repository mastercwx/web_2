import { prisma } from '~/server/utils/prisma'
import { getPostVersions } from '~/server/utils/post-version'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const postId = Number(getRouterParam(event, 'id'))

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章ID',
    })
  }

  // 查找文章
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 检查权限（只有作者或管理员可以查看版本历史）
  if (post.authorId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限查看版本历史',
    })
  }

  // 获取版本历史
  const versions = await getPostVersions(postId)

  return {
    code: 200,
    data: { versions },
  }
})
