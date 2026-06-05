import { getActiveAds, recordImpression } from '~/server/utils/ads'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const position = query.position as string

  if (!position) {
    throw createError({
      statusCode: 400,
      message: '广告位置不能为空',
    })
  }

  const ads = await getActiveAds(position)

  // 记录展示
  const headers = getRequestHeaders(event)
  const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
  const userAgent = headers['user-agent'] || 'unknown'

  const auth = event.context['auth']
  await Promise.all(ads.map((ad) => recordImpression(ad.id, auth?.id, ip as string, userAgent)))

  return { data: ads }
})
