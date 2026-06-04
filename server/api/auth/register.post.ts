import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'
import { generateToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 验证必填字段
  if (!body.username || !body.email || !body.password) {
    throw createError({
      statusCode: 400,
      message: '用户名、邮箱和密码不能为空',
    })
  }

  // 验证用户名长度
  if (body.username.length < 2 || body.username.length > 50) {
    throw createError({
      statusCode: 400,
      message: '用户名长度需要在 2-50 个字符之间',
    })
  }

  // 验证密码长度
  if (body.password.length < 6) {
    throw createError({
      statusCode: 400,
      message: '密码长度不能少于 6 个字符',
    })
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      message: '邮箱格式不正确',
    })
  }

  // 检查用户名是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: body.username }, { email: body.email }],
    },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: existingUser.username === body.username ? '用户名已存在' : '邮箱已存在',
    })
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(body.password, 10)

  // 创建用户
  const user = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  // 生成 Token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  return {
    code: 200,
    message: '注册成功',
    data: {
      user,
      token,
    },
  }
})
