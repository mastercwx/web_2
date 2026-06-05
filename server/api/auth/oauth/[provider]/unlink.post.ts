import { prisma } from '~/server/utils/prisma'
import type { OAuthProvider } from '~/server/utils/oauth'
import { OAUTH_PROVIDERS } from '~/server/utils/oauth'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const provider = getRouterParam(event, 'provider') as OAuthProvider

  // 验证提供商
  if (!provider || !(provider in OAUTH_PROVIDERS)) {
    throw createError({
      statusCode: 400,
      message: '不支持的 OAuth 提供商',
    })
  }

  // 使用 userId 和 provider 查找
  const userAccount = await prisma.oAuthAccount.findFirst({
    where: {
      userId: auth.userId,
      provider,
    },
  })

  if (!userAccount) {
    throw createError({
      statusCode: 404,
      message: '未找到绑定的 OAuth 账号',
    })
  }

  // 检查用户是否有密码（如果没有密码，不允许解绑最后一个 OAuth 账号）
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      oauthAccounts: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 如果用户没有密码且只有一个 OAuth 账号，不允许解绑
  if (!user.password && user.oauthAccounts.length <= 1) {
    throw createError({
      statusCode: 400,
      message: '请先设置密码后再解绑 OAuth 账号',
    })
  }

  // 删除 OAuth 账号关联
  await prisma.oAuthAccount.delete({
    where: {
      id: userAccount.id,
    },
  })

  return {
    code: 200,
    message: '解绑成功',
  }
})
