import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env['DATABASE_URL']!)

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🌱 开始播种数据...')

  // 创建管理员用户
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hgweb.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hgweb.com',
      password: 'admin123', // 实际项目中应该使用加密密码
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })
  console.log('✅ 创建管理员用户:', admin.username)

  // 创建普通用户
  const user = await prisma.user.upsert({
    where: { email: 'user@hgweb.com' },
    update: {},
    create: {
      username: 'user',
      email: 'user@hgweb.com',
      password: 'user123',
      role: 'USER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    },
  })
  console.log('✅ 创建普通用户:', user.username)

  // 创建标签
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Nuxt' },
      update: {},
      create: { name: 'Nuxt' },
    }),
    prisma.tag.upsert({
      where: { name: 'Vue' },
      update: {},
      create: { name: 'Vue' },
    }),
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript' },
    }),
    prisma.tag.upsert({
      where: { name: 'Prisma' },
      update: {},
      create: { name: 'Prisma' },
    }),
  ])
  console.log('✅ 创建标签:', tags.map((t) => t.name).join(', '))

  // 创建示例文章
  const post = await prisma.post.create({
    data: {
      title: '欢迎使用 HG Web',
      slug: 'welcome-to-hg-web',
      content: `# 欢迎来到 HG Web

这是一个基于 Nuxt 3 构建的现代化 Web 应用。

## 技术栈

- **Nuxt 3**: Vue 3 全栈框架
- **TypeScript**: 类型安全
- **Prisma**: 现代化 ORM
- **Tailwind CSS**: 实用优先的 CSS 框架

## 开始使用

\`\`\`bash
npm run dev
\`\`\`

祝你使用愉快！`,
      published: true,
      authorId: admin.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[1].id }],
      },
    },
  })
  console.log('✅ 创建示例文章:', post.title)

  console.log('🎉 数据播种完成！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 数据播种失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
