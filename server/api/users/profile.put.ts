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
  const { username, email } = body

  if (!username || !email) {
    throw createError({
      statusCode: 400,
      message: '用户名和邮箱不能为空',
    })
  }

  if (username.length < 2 || username.length > 50) {
    throw createError({
      statusCode: 400,
      message: '用户名长度需要在 2-50 个字符之间',
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      message: '邮箱格式不正确',
    })
  }

  // 检查用户名是否已被其他用户使用
  const existingUsername = await prisma.user.findFirst({
    where: {
      username,
      id: { not: auth.userId },
    },
  })

  if (existingUsername) {
    throw createError({
      statusCode: 400,
      message: '用户名已被使用',
    })
  }

  // 检查邮箱是否已被其他用户使用
  const existingEmail = await prisma.user.findFirst({
    where: {
      email,
      id: { not: auth.userId },
    },
  })

  if (existingEmail) {
    throw createError({
      statusCode: 400,
      message: '邮箱已被使用',
    })
  }

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { username, email },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  })

  return {
    code: 200,
    message: '个人资料更新成功',
    data: { user },
  }
})
