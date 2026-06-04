import { prisma } from '~/server/utils/prisma'
import { restorePostVersion } from '~/server/utils/post-version'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const postId = Number(getRouterParam(event, 'id'))
  const versionId = Number(getRouterParam(event, 'versionId'))

  if (!postId || !versionId) {
    throw createError({
      statusCode: 400,
      message: '缺少必要参数',
    })
  }

  // 查找文章
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, slug: true },
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 检查权限（只有作者或管理员可以恢复版本）
  if (post.authorId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限恢复版本',
    })
  }

  // 恢复版本
  const restoredPost = await restorePostVersion(postId, versionId, auth.userId)

  return {
    code: 200,
    message: '版本恢复成功',
    data: {
      post: {
        ...restoredPost,
        slug: post.slug,
      },
    },
  }
})
