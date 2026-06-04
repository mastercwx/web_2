import nodemailer from 'nodemailer'

// 邮件配置接口
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

// 创建邮件传输器
function createTransporter() {
  const config: EmailConfig = {
    host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port: Number(process.env['SMTP_PORT']) || 587,
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: {
      user: process.env['SMTP_USER'] || '',
      pass: process.env['SMTP_PASS'] || '',
    },
    from: process.env['SMTP_FROM'] || '"HG Web" <noreply@hgweb.com>',
  }

  return nodemailer.createTransport(config)
}

// 邮件选项接口
interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// 发送邮件
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter()

    await transporter.sendMail({
      from: process.env['SMTP_FROM'] || '"HG Web" <noreply@hgweb.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    console.log(`Email sent to ${options.to}: ${options.subject}`)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// 邮件模板基础样式
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
  .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
`

// 通用邮件模板包装
function wrapTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>此邮件由 HG Web 自动发送，请勿直接回复。</p>
      <p>© ${new Date().getFullYear()} HG Web. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

// 验证邮件模板
export function getVerificationEmailTemplate(username: string, verificationUrl: string): string {
  const content = `
    <p>你好，${username}！</p>
    <p>感谢你注册 HG Web。请点击下面的按钮验证你的邮箱地址：</p>
    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">验证邮箱</a>
    </p>
    <p>如果按钮无法点击，请复制以下链接到浏览器打开：</p>
    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
    <p>此链接将在 24 小时后失效。</p>
    <p>如果你没有注册账号，请忽略此邮件。</p>
  `
  return wrapTemplate(content, '邮箱验证')
}

// 密码重置邮件模板
export function getPasswordResetTemplate(username: string, resetUrl: string): string {
  const content = `
    <p>你好，${username}！</p>
    <p>我们收到了你的密码重置请求。请点击下面的按钮重置密码：</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">重置密码</a>
    </p>
    <p>如果按钮无法点击，请复制以下链接到浏览器打开：</p>
    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
    <p>此链接将在 1 小时后失效。</p>
    <p>如果你没有请求重置密码，请忽略此邮件，你的账号将保持安全。</p>
  `
  return wrapTemplate(content, '密码重置')
}

// 评论通知邮件模板
export function getCommentNotificationTemplate(
  authorUsername: string,
  commenterUsername: string,
  postTitle: string,
  commentContent: string,
  postUrl: string,
): string {
  const content = `
    <p>你好，${authorUsername}！</p>
    <p><strong>${commenterUsername}</strong> 在你的文章《${postTitle}》中发表了评论：</p>
    <div class="info-box">
      <p style="margin: 0;">${commentContent}</p>
    </div>
    <p style="text-align: center;">
      <a href="${postUrl}" class="button">查看评论</a>
    </p>
  `
  return wrapTemplate(content, '新评论通知')
}

// 点赞通知邮件模板
export function getLikeNotificationTemplate(
  authorUsername: string,
  likerUsername: string,
  postTitle: string,
  postUrl: string,
): string {
  const content = `
    <p>你好，${authorUsername}！</p>
    <p><strong>${likerUsername}</strong> 赞了你的文章《${postTitle}》</p>
    <p style="text-align: center;">
      <a href="${postUrl}" class="button">查看文章</a>
    </p>
  `
  return wrapTemplate(content, '收到新点赞')
}

// 关注通知邮件模板
export function getFollowNotificationTemplate(
  followedUsername: string,
  followerUsername: string,
  followerProfileUrl: string,
): string {
  const content = `
    <p>你好，${followedUsername}！</p>
    <p><strong>${followerUsername}</strong> 关注了你</p>
    <p style="text-align: center;">
      <a href="${followerProfileUrl}" class="button">查看主页</a>
    </p>
  `
  return wrapTemplate(content, '新粉丝通知')
}

// 系统公告邮件模板
export function getSystemAnnouncementTemplate(
  username: string,
  title: string,
  message: string,
): string {
  const content = `
    <p>你好，${username}！</p>
    <h3>${title}</h3>
    <div class="info-box">
      <p style="margin: 0;">${message}</p>
    </div>
  `
  return wrapTemplate(content, '系统公告')
}

// 欢迎邮件模板
export function getWelcomeEmailTemplate(username: string): string {
  const content = `
    <p>你好，${username}！</p>
    <p>欢迎加入 HG Web！🎉</p>
    <p>在这里你可以：</p>
    <ul>
      <li>📝 撰写和发布技术文章</li>
      <li>💬 与其他开发者交流讨论</li>
      <li>❤️ 收藏和点赞优质内容</li>
      <li>👥 关注感兴趣的作者</li>
    </ul>
    <p style="text-align: center;">
      <a href="${process.env['APP_URL'] || 'http://localhost:3000'}" class="button">开始探索</a>
    </p>
    <p>如果你有任何问题，欢迎联系我们。</p>
  `
  return wrapTemplate(content, '欢迎加入')
}
