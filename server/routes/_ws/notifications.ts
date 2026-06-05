/**
 * WebSocket 端点 - 实时通知
 * 路径: /_ws/notifications
 */

import { wsManager } from '~/server/utils/websocket'

export default defineWebSocketHandler({
  open(peer) {
    // 从查询参数获取用户 ID
    const url = new URL(peer.request?.url || '', 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (userId) {
      wsManager.addClient(Number(userId), peer)
      peer.send(
        JSON.stringify({
          event: 'connected',
          data: { message: 'WebSocket connected successfully' },
        }),
      )
    }
  },

  message(peer, message) {
    // 处理客户端发送的消息
    try {
      const data = JSON.parse(message.toString())
      console.log('WebSocket message received:', data)

      // 可以处理客户端的心跳或其他消息
      if (data.event === 'ping') {
        peer.send(JSON.stringify({ event: 'pong', data: {} }))
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  },

  close(peer) {
    // 移除客户端连接
    const url = new URL(peer.request?.url || '', 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (userId) {
      wsManager.removeClient(Number(userId), peer)
    }
  },

  error(peer, error) {
    console.error('WebSocket error:', error)
    const url = new URL(peer.request?.url || '', 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (userId) {
      wsManager.removeClient(Number(userId), peer)
    }
  },
})
