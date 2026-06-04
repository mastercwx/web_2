import { prisma } from '~/server/utils/prisma'
import { savePostVersion } from '~/server/utils/post-version'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: '缺少文章标识',
    })
  }

  const body = await readBody(event)

  // 查找文章
  const existingPost = await prisma.post.findUnique({
    where: { slug },
  })

  if (!existingPost) {
    throw createError({
      statusCode: 404,
      message: '文章不存在',
    })
  }

  // 检查权限（只有作者或管理员可以编辑）
  if (existingPost.authorId !== auth.userId && auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '没有权限编辑此文章',
    })
  }

  // 检查内容是否有变化，如果有变化则保存版本
  const titleChanged = body.title !== undefined && body.title !== existingPost.title
  const contentChanged = body.content !== undefined && body.content !== existingPost.content

  if (titleChanged || contentChanged) {
    await savePostVersion(
      existingPost.id,
      existingPost.title,
      existingPost.content,
      auth.userId,
      body.versionComment || '编辑保存',
    )
  }

  // 处理定时发布
  let scheduledAt = existingPost.scheduledAt
  if (body.scheduledAt !== undefined) {
    if (body.scheduledAt === null) {
      scheduledAt = null
    } else {
      scheduledAt = new Date(body.scheduledAt)
      if (Number.isNaN(scheduledAt.getTime())) {
        throw createError({
          statusCode: 400,
          message: '无效的定时发布时间',
        })
      }
      // 如果设置了定时发布，自动设为未发布
      body.published = false
    }
  }

  // 更新文章
  const post = await prisma.post.update({
    where: { slug },
    data: {
      title: body.title,
      content: body.content,
      published: body.published,
      scheduledAt,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      published: true,
      scheduledAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  return {
    code: 200,
    message: '文章更新成功',
    data: { post },
  }
})
