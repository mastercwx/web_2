import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

/**
 * Prisma Client 单例
 * 避免在开发环境中创建多个连接实例
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaMariaDb(process.env['DATABASE_URL']!)

  return new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env['NODE_ENV'] !== 'development') {
  globalForPrisma.prisma = prisma
}
