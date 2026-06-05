import { getModerationStats } from '~/server/utils/content-moderation'

export default defineEventHandler(async (_event) => {
  const stats = await getModerationStats()

  return {
    code: 200,
    data: stats,
  }
})
