import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const q = ((query['q'] as string) || '').trim()
  const page = Number(query['page']) || 1
  const pageSize = Math.min(Number(query['pageSize']) || 10, 50)
  const tag = query['tag'] as string | undefined
  const author = query['author'] as string | undefined
  const sortBy = (query['sortBy'] as string) || 'relevance'
  const dateFrom = query['dateFrom'] as string | undefined
  const dateTo = query['dateTo'] as string | undefined

  if (!q) {
    return {
      code: 200,
      data: {
        posts: [],
        query: '',
        pagination: { page: 1, pageSize, total: 0, totalPages: 0 },
      },
    }
  }

  // 拆分搜索关键词
  const keywords = q.split(/\s+/).filter((k) => k.length > 0)

  // 构建搜索条件
  const searchConditions = keywords.map((keyword) => ({
    OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }],
  }))

  const where: any = {
    published: true,
    AND: searchConditions,
  }

  // 标签筛选
  if (tag) {
    where.tags = { some: { name: tag } }
  }

  // 作者筛选
  if (author) {
    where.author = { username: author }
  }

  // 日期范围筛选
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      where.createdAt.lte = endDate
    }
  }

  // 排序方式
  let orderBy: any
  switch (sortBy) {
    case 'date_asc':
      orderBy = { createdAt: 'asc' }
      break
    case 'date_desc':
      orderBy = { createdAt: 'desc' }
      break
    case 'likes':
      orderBy = { likes: { _count: 'desc' } }
      break
    case 'relevance':
    default:
      // 对于相关性排序，优先标题匹配，然后按时间倒序
      orderBy = [{ createdAt: 'desc' }]
      break
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ])

  // 如果按相关性排序，计算匹配分数
  let sortedPosts = posts
  if (sortBy === 'relevance') {
    sortedPosts = posts
      .map((post) => {
        let score = 0
        const titleLower = post.title.toLowerCase()
        const contentLower = post.content.toLowerCase()

        for (const keyword of keywords) {
          const kw = keyword.toLowerCase()
          // 标题完全匹配得分更高
          if (titleLower === kw) score += 100
          // 标题包含关键词
          if (titleLower.includes(kw)) score += 50
          // 标题开头匹配
          if (titleLower.startsWith(kw)) score += 30
          // 内容包含关键词
          const contentMatches = (
            contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
          ).length
          score += Math.min(contentMatches * 5, 40)
        }

        return { ...post, _score: score }
      })
      .sort((a, b) => b._score - a._score)
  }

  // 高亮匹配的文本片段
  const highlightedPosts = sortedPosts.map((post) => {
    // 找到第一个匹配的内容片段
    let excerpt = ''
    const contentLower = post.content.toLowerCase()
    for (const keyword of keywords) {
      const idx = contentLower.indexOf(keyword.toLowerCase())
      if (idx !== -1) {
        const start = Math.max(0, idx - 60)
        const end = Math.min(post.content.length, idx + keyword.length + 100)
        excerpt =
          (start > 0 ? '...' : '') +
          post.content.substring(start, end) +
          (end < post.content.length ? '...' : '')
        break
      }
    }
    if (!excerpt) {
      excerpt = post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '')
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt,
      createdAt: post.createdAt,
      author: post.author,
      tags: post.tags,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    }
  })

  return {
    code: 200,
    data: {
      posts: highlightedPosts,
      query: q,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  }
})
