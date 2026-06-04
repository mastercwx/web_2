import { prisma } from '~/server/utils/prisma'

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

  // 创建文章
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      slug,
      authorId: auth.userId,
      published: body.published || false,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      published: true,
      createdAt: true,
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
    message: '文章创建成功',
    data: { post },
  }
})
