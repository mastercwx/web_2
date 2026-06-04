import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = ((query['q'] as string) || '').trim()

  if (!q || q.length < 2) {
    return {
      code: 200,
      data: {
        suggestions: [],
        hotTags: [],
      },
    }
  }

  // 并行查询：标题匹配、热门标签
  const [titleMatches, hotTags] = await Promise.all([
    // 从标题中获取匹配的建议
    prisma.post.findMany({
      where: {
        published: true,
        title: { contains: q },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    // 获取与查询匹配的热门标签
    prisma.tag.findMany({
      where: {
        name: { contains: q },
        posts: { some: { published: true } },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { posts: { where: { published: true } } },
        },
      },
      take: 5,
      orderBy: {
        posts: { _count: 'desc' },
      },
    }),
  ])

  // 提取内容中匹配的关键词片段
  const contentMatches = await prisma.post.findMany({
    where: {
      published: true,
      content: { contains: q },
    },
    select: {
      content: true,
    },
    take: 10,
  })

  // 从内容中提取匹配的短语
  const matchedPhrases = new Set<string>()
  const qLower = q.toLowerCase()

  for (const post of contentMatches) {
    const content = post.content
    const contentLower = content.toLowerCase()
    const idx = contentLower.indexOf(qLower)

    if (idx !== -1) {
      // 提取匹配位置前后的上下文作为短语
      const start = Math.max(0, idx - 10)
      const end = Math.min(content.length, idx + q.length + 20)
      const phrase = content.substring(start, end).trim()
      if (phrase.length > 3 && phrase.length < 50) {
        matchedPhrases.add(phrase)
      }
    }
  }

  return {
    code: 200,
    data: {
      suggestions: titleMatches.map((p) => ({
        type: 'post',
        id: p.id,
        text: p.title,
        slug: p.slug,
      })),
      hotTags: hotTags.map((t) => ({
        type: 'tag',
        id: t.id,
        text: t.name,
        count: t._count.posts,
      })),
      matchedPhrases: Array.from(matchedPhrases).slice(0, 3),
    },
  }
})
