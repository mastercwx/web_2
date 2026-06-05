import { getUserVariant } from '~/server/utils/experiments'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const name = getRouterParam(event, 'name')

  if (!name) {
    throw createError({
      statusCode: 400,
      message: '缺少实验名称',
    })
  }

  const variant = await getUserVariant(auth.userId, name)

  return {
    code: 200,
    data: {
      experiment: name,
      variant,
    },
  }
})
