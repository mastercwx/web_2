import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth || auth.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权访问' })
  }

  const query = getQuery(event)
  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 20
  const unreadOnly = query['unread'] === 'true'

  const where = unreadOnly ? { read: false } : {}

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactMessage.count({ where }),
  ])

  // 获取未读数量
  const unreadCount = await prisma.contactMessage.count({
    where: { read: false },
  })

  return {
    messages,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
