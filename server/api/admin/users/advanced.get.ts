import { getUsersWithAdvancedFilter } from '~/server/utils/user-management'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Number(query['page']) || 1
  const pageSize = Number(query['pageSize']) || 20

  const filter = {
    search: query['search'] as string | undefined,
    role: query['role'] as string | undefined,
    status: query['status'] as string | undefined,
    dateFrom: query['dateFrom'] as string | undefined,
    dateTo: query['dateTo'] as string | undefined,
    minPosts: query['minPosts'] ? Number(query['minPosts']) : undefined,
    maxPosts: query['maxPosts'] ? Number(query['maxPosts']) : undefined,
    sortBy: query['sortBy'] as string | undefined,
    sortOrder: query['sortOrder'] as 'asc' | 'desc' | undefined,
  }

  const result = await getUsersWithAdvancedFilter(filter, page, pageSize)

  return {
    code: 200,
    data: result,
  }
})
