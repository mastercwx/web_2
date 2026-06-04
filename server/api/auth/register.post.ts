import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { prisma } from '~/server/utils/prisma'
import { generateToken } from '~/server/utils/jwt'
import {
  sendEmail,
  getVerificationEmailTemplate,
  getWelcomeEmailTemplate,
} from '~/server/utils/email'

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

  // 生成验证令牌
  const verifyToken = randomBytes(32).toString('hex')
  const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时

  // 创建用户
  const user = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      password: hashedPassword,
      verifyToken,
      verifyTokenExpiry,
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

  // 发送验证邮件（异步，不阻塞注册）
  const appUrl = process.env['APP_URL'] || 'http://localhost:3000'
  const verificationUrl = `${appUrl}/verify-email?token=${verifyToken}`

  sendEmail({
    to: user.email,
    subject: '【HG Web】邮箱验证',
    html: getVerificationEmailTemplate(user.username, verificationUrl),
  }).catch((err) => console.error('Failed to send verification email:', err))

  // 发送欢迎邮件（异步）
  sendEmail({
    to: user.email,
    subject: '【HG Web】欢迎加入',
    html: getWelcomeEmailTemplate(user.username),
  }).catch((err) => console.error('Failed to send welcome email:', err))

  return {
    code: 200,
    message: '注册成功，验证邮件已发送到您的邮箱',
    data: {
      user,
      token,
    },
  }
})
