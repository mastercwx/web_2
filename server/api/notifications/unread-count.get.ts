import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']
  if (!auth) {
    return { data: { count: 0 } }
  }

  const count = await prisma.notification.count({
    where: {
      userId: auth.userId,
      isRead: false,
    },
  })

  return { data: { count } }
})
