import { getModerationQueue } from '~/server/utils/content-moderation'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const type = (query['type'] as 'all' | 'comments' | 'posts' | 'reports') || 'all'
  const status = (query['status'] as string) || 'PENDING'
  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 20

  const result = await getModerationQueue(type, status, page, pageSize)

  return {
    code: 200,
    data: result,
  }
})
