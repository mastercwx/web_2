import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query['year'] ? Number(query['year']) : undefined

  // 获取所有已发布文章，按创建时间降序
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(year && {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // 按年月分组
  const archives: Record<string, Record<string, typeof posts>> = {}

  for (const post of posts) {
    const date = new Date(post.createdAt)
    const postYear = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    if (!archives[postYear]) {
      archives[postYear] = {}
    }
    if (!archives[postYear][month]) {
      archives[postYear][month] = []
    }
    archives[postYear][month].push(post)
  }

  // 获取所有年份
  const years = Object.keys(archives).sort((a, b) => Number(b) - Number(a))

  // 统计每年的文章数
  const yearCounts = years.map((y) => ({
    year: y,
    count: Object.values(archives[y] || {}).reduce((sum, monthPosts) => sum + monthPosts.length, 0),
  }))

  return {
    code: 200,
    data: {
      archives,
      years,
      yearCounts,
      totalPosts: posts.length,
    },
  }
})
