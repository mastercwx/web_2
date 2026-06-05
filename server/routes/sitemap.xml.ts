import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const siteUrl = getRequestURL(event).origin

  // 获取所有已发布文章
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  // 获取所有标签
  const tags = await prisma.tag.findMany({
    select: {
      name: true,
    },
  })

  // 静态页面
  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/posts', changefreq: 'daily', priority: '0.9' },
    { url: '/tags', changefreq: 'weekly', priority: '0.8' },
    { url: '/archive', changefreq: 'weekly', priority: '0.7' },
    { url: '/about', changefreq: 'monthly', priority: '0.5' },
    { url: '/search', changefreq: 'monthly', priority: '0.5' },
  ]

  // 文章页面
  const postPages = posts.map((post) => ({
    url: `/posts/${post.slug}`,
    lastmod: post.updatedAt.toISOString(),
    changefreq: 'monthly',
    priority: '0.8',
  }))

  // 标签页面
  const tagPages = tags.map((tag) => ({
    url: `/tags/${encodeURIComponent(tag.name)}`,
    changefreq: 'weekly',
    priority: '0.6',
  }))

  const allPages = [...staticPages, ...postPages, ...tagPages]

  const urls = allPages
    .map(
      (page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>${'lastmod' in page && page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return sitemap
})
