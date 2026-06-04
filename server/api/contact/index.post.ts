import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 验证必填字段
  if (!body.name || !body.email || !body.content) {
    throw createError({ statusCode: 400, message: '请填写必填字段' })
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({ statusCode: 400, message: '邮箱格式不正确' })
  }

  // 创建联系消息
  const message = await prisma.contactMessage.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim(),
      subject: body.subject?.trim() || null,
      content: body.content.trim(),
    },
  })

  return {
    success: true,
    message: '消息已发送，我们会尽快回复您',
    id: message.id,
  }
})
