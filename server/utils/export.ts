// 数据导出工具

// 将数据转换为 CSV 格式
export function jsonToCSV(data: Record<string, any>[], columns?: string[]): string {
  if (data.length === 0) {
    return ''
  }

  // 确定列名
  const keys = columns || Object.keys(data[0]!)

  // 生成 CSV 头部
  const header = keys.map((key) => escapeCSVField(key)).join(',')

  // 生成 CSV 行
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key]
        if (value === null || value === undefined) {
          return ''
        }
        if (typeof value === 'object') {
          return escapeCSVField(JSON.stringify(value))
        }
        return escapeCSVField(String(value))
      })
      .join(','),
  )

  return [header, ...rows].join('\n')
}

// 转义 CSV 字段
function escapeCSVField(field: string): string {
  // 如果字段包含逗号、双引号或换行符，需要用双引号包裹
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    // 将双引号转义为两个双引号
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

// 格式化日期为可读格式
export function formatDateForExport(date: Date | string): string {
  const d = new Date(date)
  return d
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '')
}

// 导出用户数据
export function formatUserForExport(user: any) {
  return {
    ID: user.id,
    用户名: user.username,
    邮箱: user.email,
    角色: user.role,
    状态: user.status,
    邮箱验证: user.emailVerified ? '是' : '否',
    两步验证: user.twoFactorEnabled ? '是' : '否',
    注册时间: formatDateForExport(user.createdAt),
  }
}

// 导出文章数据
export function formatPostForExport(post: any) {
  return {
    ID: post.id,
    标题: post.title,
    标识: post.slug,
    作者: post.author?.username || '',
    状态: post.published ? '已发布' : '草稿',
    点赞数: post._count?.likes || 0,
    评论数: post._count?.comments || 0,
    收藏数: post._count?.favorites || 0,
    创建时间: formatDateForExport(post.createdAt),
    更新时间: formatDateForExport(post.updatedAt),
  }
}

// 导出评论数据
export function formatCommentForExport(comment: any) {
  return {
    ID: comment.id,
    内容: comment.content,
    评论者: comment.user?.username || '',
    文章标题: comment.post?.title || '',
    状态: comment.status,
    创建时间: formatDateForExport(comment.createdAt),
  }
}

// 导出媒体数据
export function formatMediaForExport(media: any) {
  return {
    ID: media.id,
    文件名: media.originalName,
    类型: media.mimeType,
    大小: formatFileSize(media.size),
    文件夹: media.folder,
    上传者: media.uploader?.username || '',
    上传时间: formatDateForExport(media.createdAt),
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成文件名
export function generateExportFilename(type: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `hg-web-${type}-${timestamp}.${format}`
}
