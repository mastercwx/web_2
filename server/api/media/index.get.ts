import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.context['auth']

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }

  const query = getQuery(event)
  const page = Number(query['page']) || 1
  const pageSize = Math.min(Number(query['pageSize']) || 20, 100)
  const mimeType = query['mimeType'] as string | undefined
  const folder = query['folder'] as string | undefined
  const search = query['search'] as string | undefined

  const where: any = {}

  // 普通用户只能看到自己上传的文件
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    where.uploaderId = auth.userId
  }

  // 按 MIME 类型筛选
  if (mimeType) {
    if (mimeType === 'image') {
      where.mimeType = { startsWith: 'image/' }
    } else if (mimeType === 'video') {
      where.mimeType = { startsWith: 'video/' }
    } else if (mimeType === 'document') {
      where.mimeType = {
        in: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      }
    }
  }

  // 按文件夹筛选
  if (folder) {
    where.folder = folder
  }

  // 搜索文件名
  if (search) {
    where.OR = [
      { originalName: { contains: search } },
      { alt: { contains: search } },
      { caption: { contains: search } },
    ]
  }

  const [files, total] = await Promise.all([
    prisma.media.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    }),
    prisma.media.count({ where }),
  ])

  // 统计信息
  const stats = await prisma.media.aggregate({
    where: user?.role === 'ADMIN' ? {} : { uploaderId: auth.userId },
    _sum: { size: true },
    _count: true,
  })

  return {
    code: 200,
    data: {
      files,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
      },
    },
  }
})
