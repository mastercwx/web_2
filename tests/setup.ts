import { vi } from 'vitest'

// Mock prisma to avoid database connection in tests
vi.mock('~/server/utils/prisma', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}))
