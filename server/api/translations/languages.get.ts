import { SUPPORTED_LANGUAGES } from '~/server/utils/multi-language'

export default defineEventHandler(() => {
  return {
    data: SUPPORTED_LANGUAGES,
  }
})
