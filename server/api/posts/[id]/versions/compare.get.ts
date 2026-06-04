import { prisma } from '~/server/utils/prisma'
import { compareVersions } from '~/server/utils/post-version'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const postId = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)

  if (!postId) {
    throw createError({
      statusCode: 400,
      message: '缺少文章ID',
    })
  }

  const versionId1 = Number(query.version1)
  const versionId2 = Number(query.version2)

  if (!versionId1 || !versionId2) {
    throw createError({
      statusCode: 400,
      message: '缺少版本ID参数',
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

  // 检查权限
  if (post.authorId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限查看版本对比',
    })
  }

  // 比较版本
  const comparison = await compareVersions(postId, versionId1, versionId2)

  return {
    code: 200,
    data: comparison,
  }
})
