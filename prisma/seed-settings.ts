import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
})

async function main() {
  console.log('开始初始化系统设置...')

  const defaultSettings = [
    // 站点信息
    { key: 'site.name', value: 'HG Blog', group: 'site', label: '站点名称' },
    { key: 'site.description', value: '一个现代化的博客系统', group: 'site', label: '站点描述' },
    { key: 'site.keywords', value: 'blog,nuxt,vue,typescript', group: 'site', label: '站点关键词' },
    { key: 'site.logo', value: '', group: 'site', label: '站点Logo' },
    { key: 'site.favicon', value: '', group: 'site', label: '站点图标' },

    // 社交媒体
    { key: 'social.github', value: '', group: 'social', label: 'GitHub链接' },
    { key: 'social.twitter', value: '', group: 'social', label: 'Twitter链接' },
    { key: 'social.email', value: 'admin@example.com', group: 'social', label: '联系邮箱' },

    // 评论设置
    { key: 'comment.enabled', value: 'true', group: 'comment', label: '启用评论' },
    { key: 'comment.moderation', value: 'false', group: 'comment', label: '评论审核' },
    { key: 'comment.maxLength', value: '1000', group: 'comment', label: '评论最大长度' },

    // 邮件设置
    { key: 'email.smtp.host', value: '', group: 'email', label: 'SMTP服务器' },
    { key: 'email.smtp.port', value: '587', group: 'email', label: 'SMTP端口' },
    { key: 'email.smtp.user', value: '', group: 'email', label: 'SMTP用户名' },
    { key: 'email.smtp.pass', value: '', group: 'email', label: 'SMTP密码' },

    // 维护模式
    { key: 'maintenance.enabled', value: 'false', group: 'maintenance', label: '维护模式' },
    {
      key: 'maintenance.message',
      value: '网站正在维护中，请稍后再访问。',
      group: 'maintenance',
      label: '维护提示信息',
    },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log(`已初始化 ${defaultSettings.length} 个默认设置`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
