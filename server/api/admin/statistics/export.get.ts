import { exportStatistics } from '~/server/utils/advanced-statistics'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = (query['type'] as string) || 'overview'
  const period = (query['period'] as string) || 'month'
  const format = (query['format'] as 'json' | 'csv') || 'json'

  const data = await exportStatistics(type, period, format)

  if (format === 'csv') {
    setResponseHeaders(event, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=statistics-${type}-${period}.csv`,
    })
    return data
  }

  return {
    code: 200,
    data: JSON.parse(data),
  }
})
