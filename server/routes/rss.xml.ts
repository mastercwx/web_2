import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      createdAt: true,
      author: {
        select: {
          username: true,
        },
      },
    },
  })

  const siteUrl = getRequestURL(event).origin
  const feedUrl = `${siteUrl}/rss.xml`

  const items = posts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <author>${post.author.username}</author>
      <description><![CDATA[${post.content.substring(0, 300)}...]]></description>
    </item>`,
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HG Web</title>
    <link>${siteUrl}</link>
    <description>A modern web application built with Nuxt 3</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return rss
})
