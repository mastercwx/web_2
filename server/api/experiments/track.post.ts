import { trackExperimentEvent } from '~/server/utils/experiments'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  const body = await readBody(event)
  const { experimentName, eventName, eventValue, metadata } = body

  if (!experimentName || !eventName) {
    throw createError({
      statusCode: 400,
      message: '缺少必要参数',
    })
  }

  // 可选认证（支持匿名事件）
  const userId = auth?.userId || null

  await trackExperimentEvent(experimentName, userId, eventName, eventValue, metadata)

  return {
    code: 200,
    message: '事件记录成功',
  }
})
