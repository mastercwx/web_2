import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  // 获取热门标签（按文章数量排序）
  const hotTags = await prisma.tag.findMany({
    where: {
      posts: { some: { published: true } },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: { posts: { where: { published: true } } },
      },
    },
    take: 10,
    orderBy: {
      posts: { _count: 'desc' },
    },
  })

  // 获取最新发布的文章标题（用于推荐搜索）
  const recentPosts = await prisma.post.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  })

  return {
    code: 200,
    data: {
      hotTags: hotTags.map((t) => ({
        id: t.id,
        name: t.name,
        count: t._count.posts,
      })),
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
      })),
    },
  }
})
