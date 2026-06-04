import { prisma } from '~/server/utils/prisma'
import { logActivityFromEvent, ActivityActions } from '~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const body = await readBody(event)

  // 验证必填字段
  if (!body.title || !body.content) {
    throw createError({
      statusCode: 400,
      message: '标题和内容不能为空',
    })
  }

  // 生成 slug
  const slug = body.title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  // 检查 slug 是否已存在
  const existingPost = await prisma.post.findUnique({
    where: { slug },
  })

  if (existingPost) {
    throw createError({
      statusCode: 409,
      message: '文章标识已存在',
    })
  }

  // 处理定时发布
  let scheduledAt = null
  if (body.scheduledAt) {
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

  // 创建文章
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      slug,
      authorId: auth.userId,
      published: body.published || false,
      scheduledAt,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      published: true,
      scheduledAt: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  // 记录创建文章活动
  await logActivityFromEvent(event, ActivityActions.POST_CREATE, {
    entity: 'post',
    entityId: post.id,
    details: `创建文章: ${post.title}`,
  })

  return {
    code: 200,
    message: '文章创建成功',
    data: { post },
  }
})
