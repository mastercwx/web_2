import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'
import { generateToken } from '~/server/utils/jwt'
import { logActivityFromEvent, ActivityActions } from '~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 验证必填字段
  if (!body.username || !body.password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空',
    })
  }

  // 查找用户（支持用户名或邮箱登录）
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: body.username }, { email: body.username }],
    },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
      status: true,
      createdAt: true,
      twoFactorEnabled: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误',
    })
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(body.password, user.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误',
    })
  }

  // 检查用户状态
  if (user.status !== 'ACTIVE') {
    throw createError({
      statusCode: 403,
      message: '账号已被禁用',
    })
  }

  // 检查是否启用两步验证
  if (user.twoFactorEnabled) {
    // 生成临时令牌（5 分钟有效）
    const tempToken = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      }),
    ).toString('base64')

    return {
      code: 200,
      message: '需要两步验证',
      data: {
        require2FA: true,
        tempToken,
      },
    }
  }

  // 生成 Token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  // 记录登录活动
  await logActivityFromEvent(event, ActivityActions.LOGIN, {
    entity: 'user',
    entityId: user.id,
    details: `用户 ${user.username} 登录成功`,
  })

  return {
    code: 200,
    message: '登录成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
  }
})
