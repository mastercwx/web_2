/**
 * 健康检查接口
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }
})
