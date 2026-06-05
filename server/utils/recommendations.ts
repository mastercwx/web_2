/**
 * 文章推荐算法服务
 * 支持：基于内容的推荐、基于用户行为的推荐、热门文章推荐
 */

import { prisma } from '~/server/utils/prisma'

// 推荐文章类型
export interface RecommendedPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  author: {
    id: number
    username: string
    avatar: string | null
  }
  tags: { id: number; name: string }[]
  score: number
  reason: string
  createdAt: Date
}

/**
 * 基于内容的推荐
 * 根据文章标签相似度推荐相关文章
 */
export async function getContentBasedRecommendations(
  postId: number,
  limit: number = 5,
): Promise<RecommendedPost[]> {
  // 获取当前文章的标签
  const currentPost = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  })

  if (!currentPost || currentPost.tags.length === 0) {
    return []
  }

  const tagIds = currentPost.tags.map((tag) => tag.id)

  // 查找有相同标签的文章
  const similarPosts = await prisma.post.findMany({
    where: {
      id: { not: postId },
      published: true,
      tags: {
        some: {
          id: { in: tagIds },
        },
      },
    },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          favorites: true,
        },
      },
    },
    take: limit * 2, // 获取更多候选文章
  })

  // 计算相似度得分
  const scoredPosts = similarPosts.map((post) => {
    const commonTags = post.tags.filter((tag) => tagIds.includes(tag.id))
    const tagScore = commonTags.length / Math.max(tagIds.length, post.tags.length)

    // 互动分数
    const interactionScore =
      (post._count.likes * 2 + post._count.favorites * 3 + post._count.comments) / 100

    // 时间衰减（越新越好）
    const daysSinceCreation = Math.max(
      1,
      (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    const timeDecay = 1 / Math.log2(daysSinceCreation + 1)

    const score = tagScore * 0.5 + interactionScore * 0.3 + timeDecay * 0.2

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: post.author,
      tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
      score,
      reason: `${commonTags.length} 个相同标签`,
      createdAt: post.createdAt,
    }
  })

  // 按得分排序并返回
  return scoredPosts.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * 基于用户行为的推荐
 * 根据用户阅读历史和点赞行为推荐文章
 */
export async function getBehaviorBasedRecommendations(
  userId: number,
  limit: number = 5,
): Promise<RecommendedPost[]> {
  // 获取用户阅读过的文章标签
  const readHistory = await prisma.readingHistory.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          tags: true,
        },
      },
    },
    orderBy: { readAt: 'desc' },
    take: 20,
  })

  // 获取用户点赞过的文章标签
  const likedPosts = await prisma.like.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          tags: true,
        },
      },
    },
    take: 20,
  })

  // 统计用户兴趣标签
  const tagCounts = new Map<number, number>()

  readHistory.forEach((history) => {
    history.post.tags.forEach((tag) => {
      tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1)
    })
  })

  likedPosts.forEach((like) => {
    like.post.tags.forEach((tag) => {
      tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 2) // 点赞权重更高
    })
  })

  // 按权重排序标签
  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tagId]) => tagId)

  if (sortedTags.length === 0) {
    return getPopularPosts(limit)
  }

  // 获取用户已读文章 ID
  const readPostIds = readHistory.map((h) => h.postId)
  const likedPostIds = likedPosts.map((l) => l.postId)
  const excludeIds = [...new Set([...readPostIds, ...likedPostIds])]

  // 推荐基于兴趣标签的文章
  const recommendedPosts = await prisma.post.findMany({
    where: {
      id: { notIn: excludeIds },
      published: true,
      tags: {
        some: {
          id: { in: sortedTags },
        },
      },
    },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          favorites: true,
        },
      },
    },
    take: limit * 2,
  })

  // 计算推荐得分
  const scoredPosts = recommendedPosts.map((post) => {
    const matchingTags = post.tags.filter((tag) => sortedTags.includes(tag.id))
    const tagScore =
      matchingTags.reduce((sum, tag) => sum + (tagCounts.get(tag.id) || 0), 0) /
      (tagCounts.get(sortedTags[0]) || 1)

    const interactionScore =
      (post._count.likes * 2 + post._count.favorites * 3 + post._count.comments) / 100

    const daysSinceCreation = Math.max(
      1,
      (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    const timeDecay = 1 / Math.log2(daysSinceCreation + 1)

    const score = tagScore * 0.4 + interactionScore * 0.4 + timeDecay * 0.2

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: post.author,
      tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
      score,
      reason: '根据您的兴趣推荐',
      createdAt: post.createdAt,
    }
  })

  return scoredPosts.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * 获取热门文章
 * 基于点赞、评论、收藏的综合热度
 */
export async function getPopularPosts(
  limit: number = 10,
  days: number = 30,
): Promise<RecommendedPost[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      createdAt: { gte: cutoffDate },
    },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          favorites: true,
          readingHistory: true,
        },
      },
    },
    take: limit * 2,
  })

  // 计算热度分数
  const scoredPosts = posts.map((post) => {
    const daysSinceCreation = Math.max(
      1,
      (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    )

    // 热度公式：互动数 / 时间衰减
    const interactions =
      post._count.likes * 3 +
      post._count.favorites * 5 +
      post._count.comments * 2 +
      post._count.readingHistory

    const score = interactions / Math.pow(daysSinceCreation, 1.5)

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: post.author,
      tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
      score,
      reason: '热门文章',
      createdAt: post.createdAt,
    }
  })

  return scoredPosts.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * 获取关注作者的最新文章
 */
export async function getFollowingPosts(
  userId: number,
  limit: number = 10,
): Promise<RecommendedPost[]> {
  // 获取关注的作者
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })

  const followingIds = following.map((f) => f.followingId)

  if (followingIds.length === 0) {
    return []
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: followingIds },
      published: true,
    },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    author: post.author,
    tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
    score: 1,
    reason: '来自您关注的作者',
    createdAt: post.createdAt,
  }))
}

/**
 * 获取个性化推荐流
 * 综合多种推荐策略
 */
export async function getPersonalizedFeed(
  userId: number | null,
  limit: number = 20,
): Promise<RecommendedPost[]> {
  if (!userId) {
    // 未登录用户返回热门文章
    return getPopularPosts(limit)
  }

  // 获取各类推荐
  const [behaviorRecs, followingRecs, popularRecs] = await Promise.all([
    getBehaviorBasedRecommendations(userId, Math.ceil(limit * 0.5)),
    getFollowingPosts(userId, Math.ceil(limit * 0.3)),
    getPopularPosts(Math.ceil(limit * 0.2), 7), // 最近一周热门
  ])

  // 合并并去重
  const seen = new Set<number>()
  const merged: RecommendedPost[] = []

  // 优先展示关注作者的内容
  followingRecs.forEach((post) => {
    if (!seen.has(post.id)) {
      seen.add(post.id)
      merged.push(post)
    }
  })

  // 然后是基于行为的推荐
  behaviorRecs.forEach((post) => {
    if (!seen.has(post.id)) {
      seen.add(post.id)
      merged.push(post)
    }
  })

  // 最后补充热门文章
  popularRecs.forEach((post) => {
    if (!seen.has(post.id)) {
      seen.add(post.id)
      merged.push(post)
    }
  })

  return merged.slice(0, limit)
}
