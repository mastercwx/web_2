interface SeoOptions {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
}

export function useSeo(options: SeoOptions = {}) {
  const siteUrl = 'https://hgweb.example.com' // TODO: 从配置获取
  const siteName = 'HG Web'
  const defaultDescription = 'A modern web application built with Nuxt 3'

  const title = options.title ? `${options.title} | ${siteName}` : siteName
  const description = options.description || defaultDescription
  const url = options.url ? `${siteUrl}${options.url}` : siteUrl
  const image = options.image || `${siteUrl}/og-image.png`

  const meta: Record<string, string>[] = [
    // 基础 Meta
    { name: 'description', content: description },
    { name: 'author', content: options.author || siteName },

    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: options.type || 'website' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]

  // 文章特有 Meta
  if (options.type === 'article') {
    if (options.publishedTime) {
      meta.push({ property: 'article:published_time', content: options.publishedTime })
    }
    if (options.modifiedTime) {
      meta.push({ property: 'article:modified_time', content: options.modifiedTime })
    }
    if (options.author) {
      meta.push({ property: 'article:author', content: options.author })
    }
    if (options.tags) {
      for (const tag of options.tags) {
        meta.push({ property: 'article:tag', content: tag })
      }
    }
  }

  useHead({
    title,
    meta,
    link: [
      { rel: 'canonical', href: url },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: `${siteName} RSS Feed`,
        href: `${siteUrl}/rss.xml`,
      },
    ],
  })
}
