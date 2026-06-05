import { prisma } from '~/server/utils/prisma'

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

// 默认语言
export const DEFAULT_LANGUAGE: LanguageCode = 'zh-CN'

/**
 * 获取语言信息
 */
export function getLanguageInfo(code: string) {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
}

/**
 * 验证语言代码是否有效
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code)
}

/**
 * 获取文章的翻译
 */
export async function getPostTranslation(postId: number, language: string) {
  if (language === DEFAULT_LANGUAGE) {
    // 返回原始文章
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        language: true,
      },
    })
    return post
  }

  // 返回翻译
  const translation = await prisma.postTranslation.findUnique({
    where: {
      postId_language: {
        postId,
        language,
      },
    },
  })

  if (!translation) {
    // 如果没有翻译，返回原始文章
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        language: true,
      },
    })
    return post
  }

  return {
    id: postId,
    title: translation.title,
    content: translation.content,
    language: translation.language,
  }
}

/**
 * 获取文章的所有翻译
 */
export async function getPostTranslations(postId: number) {
  const translations = await prisma.postTranslation.findMany({
    where: { postId },
    select: {
      language: true,
      title: true,
      content: true,
      excerpt: true,
    },
  })

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      language: true,
      title: true,
      content: true,
    },
  })

  if (!post) {
    throw new Error('文章不存在')
  }

  // 包含原始语言
  const allTranslations = [
    {
      language: post.language,
      title: post.title,
      content: post.content,
      excerpt: post.content.substring(0, 200),
      isOriginal: true,
    },
    ...translations.map((t) => ({
      ...t,
      excerpt: t.excerpt || t.content.substring(0, 200),
      isOriginal: false,
    })),
  ]

  return allTranslations
}

/**
 * 创建或更新文章翻译
 */
export async function upsertPostTranslation(
  postId: number,
  language: string,
  data: {
    title: string
    content: string
    excerpt?: string
  },
) {
  if (!isValidLanguage(language)) {
    throw new Error(`不支持的语言: ${language}`)
  }

  if (language === DEFAULT_LANGUAGE) {
    // 更新原始文章
    return prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        content: data.content,
      },
    })
  }

  // 创建或更新翻译
  return prisma.postTranslation.upsert({
    where: {
      postId_language: {
        postId,
        language,
      },
    },
    update: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
    },
    create: {
      postId,
      language,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
    },
  })
}

/**
 * 删除文章翻译
 */
export async function deletePostTranslation(postId: number, language: string) {
  if (language === DEFAULT_LANGUAGE) {
    throw new Error('不能删除原始语言')
  }

  return prisma.postTranslation.delete({
    where: {
      postId_language: {
        postId,
        language,
      },
    },
  })
}

/**
 * 获取指定语言的文章列表
 */
export async function getPostsByLanguage(
  language: string,
  options?: {
    page?: number
    limit?: number
    published?: boolean
  },
) {
  const { page = 1, limit = 10, published = true } = options || {}

  // 如果是默认语言，直接返回原始文章
  if (language === DEFAULT_LANGUAGE) {
    const where = { published, language: DEFAULT_LANGUAGE }
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return {
      posts: posts.map((post) => ({
        ...post,
        translatedTitle: post.title,
        translatedContent: post.content,
        currentLanguage: language,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // 获取有翻译的文章
  const translations = await prisma.postTranslation.findMany({
    where: { language },
    select: { postId: true },
  })

  const postIds = translations.map((t) => t.postId)

  // 获取这些文章的基本信息
  const where = {
    id: { in: postIds },
    ...(published ? { published: true } : {}),
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        tags: true,
        translations: {
          where: { language },
          select: {
            title: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ])

  return {
    posts: posts.map((post) => ({
      ...post,
      translatedTitle: post.translations[0]?.title || post.title,
      translatedContent: post.translations[0]?.content || post.content,
      currentLanguage: language,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * 获取文章翻译统计
 */
export async function getTranslationStats(postId?: number) {
  if (postId) {
    // 单篇文章的翻译统计
    const translations = await prisma.postTranslation.groupBy({
      by: ['language'],
      where: { postId },
      _count: true,
    })

    return {
      postId,
      translations: translations.map((t) => ({
        language: t.language,
        count: t._count,
      })),
      totalLanguages: translations.length + 1, // +1 for original
    }
  }

  // 全站翻译统计
  const stats = await prisma.postTranslation.groupBy({
    by: ['language'],
    _count: true,
  })

  const totalPosts = await prisma.post.count()

  return {
    totalPosts,
    translations: stats.map((s) => ({
      language: s.language,
      count: s._count,
      percentage: Math.round((s._count / totalPosts) * 100),
    })),
  }
}
