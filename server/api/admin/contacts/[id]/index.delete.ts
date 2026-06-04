import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权访问' })
  }

  const id = Number(event.context.params?.['id'])
  if (!id) {
    throw createError({ statusCode: 400, message: '无效的消息 ID' })
  }

  await prisma.contactMessage.delete({
    where: { id },
  })

  return { success: true, message: '消息已删除' }
})
