import { prisma } from '~/server/utils/prisma'

/**
 * 保存文章版本
 */
export async function savePostVersion(
  postId: number,
  title: string,
  content: string,
  authorId: number,
  comment?: string,
): Promise<void> {
  // 获取当前最大版本号
  const lastVersion = await prisma.postVersion.findFirst({
    where: { postId },
    orderBy: { version: 'desc' },
    select: { version: true, postId: true },
  })

  const newVersion = (lastVersion?.version || 0) + 1

  await prisma.postVersion.create({
    data: {
      postId,
      title,
      content,
      version: newVersion,
      comment,
      authorId,
    },
  })
}

/**
 * 获取文章版本历史
 */
export async function getPostVersions(postId: number) {
  return prisma.postVersion.findMany({
    where: { postId },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      postId: true,
      title: true,
      comment: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * 获取特定版本详情
 */
export async function getPostVersion(versionId: number) {
  return prisma.postVersion.findUnique({
    where: { id: versionId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * 恢复到指定版本
 */
export async function restorePostVersion(
  postId: number,
  versionId: number,
  authorId: number,
): Promise<{ title: string; content: string }> {
  const version = await prisma.postVersion.findUnique({
    where: { id: versionId },
  })

  if (!version || version.postId !== postId) {
    throw createError({
      statusCode: 404,
      message: '版本不存在',
    })
  }

  // 保存当前版本（恢复前）
  const currentPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { title: true, content: true },
  })

  if (currentPost) {
    await savePostVersion(
      postId,
      currentPost.title,
      currentPost.content,
      authorId,
      `恢复到版本 ${version.version} 前自动保存`,
    )
  }

  // 更新文章
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      title: version.title,
      content: version.content,
    },
    select: {
      title: true,
      content: true,
    },
  })

  // 保存恢复后的版本
  await savePostVersion(
    postId,
    updatedPost.title,
    updatedPost.content,
    authorId,
    `从版本 ${version.version} 恢复`,
  )

  return updatedPost
}

/**
 * 比较两个版本的差异
 */
export async function compareVersions(postId: number, versionId1: number, versionId2: number) {
  const [version1, version2] = await Promise.all([
    prisma.postVersion.findUnique({
      where: { id: versionId1 },
      select: {
        id: true,
        version: true,
        postId: true,
        title: true,
        content: true,
        createdAt: true,
      },
    }),
    prisma.postVersion.findUnique({
      where: { id: versionId2 },
      select: {
        id: true,
        version: true,
        postId: true,
        title: true,
        content: true,
        createdAt: true,
      },
    }),
  ])

  if (!version1 || version1.postId !== postId) {
    throw createError({
      statusCode: 404,
      message: '版本1不存在',
    })
  }

  if (!version2 || version2.postId !== postId) {
    throw createError({
      statusCode: 404,
      message: '版本2不存在',
    })
  }

  // 计算差异
  const titleChanged = version1.title !== version2.title
  const contentChanged = version1.content !== version2.content

  // 简单的行级差异
  const contentDiff = contentChanged ? computeLineDiff(version1.content, version2.content) : []

  return {
    version1,
    version2,
    titleChanged,
    contentChanged,
    contentDiff,
  }
}

/**
 * 计算行级差异
 */
function computeLineDiff(text1: string, text2: string) {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')
  const diff: Array<{
    type: 'added' | 'removed' | 'unchanged'
    line: string
    lineNum1?: number
    lineNum2?: number
  }> = []

  // 简单的逐行比较
  const maxLen = Math.max(lines1.length, lines2.length)
  let lineNum1 = 0
  let lineNum2 = 0

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i]
    const line2 = lines2[i]

    if (line1 === line2) {
      if (line1 !== undefined) {
        lineNum1++
        lineNum2++
        diff.push({ type: 'unchanged', line: line1, lineNum1, lineNum2 })
      }
    } else {
      if (line1 !== undefined) {
        lineNum1++
        diff.push({ type: 'removed', line: line1, lineNum1 })
      }
      if (line2 !== undefined) {
        lineNum2++
        diff.push({ type: 'added', line: line2, lineNum2 })
      }
    }
  }

  return diff
}
