/**
 * WebSocket 服务器管理
 * 用于实时通知推送
 */

interface WebSocketClient {
  userId: number
  ws: any
}

class WebSocketManager {
  private clients: Map<number, WebSocketClient[]> = new Map()

  // 添加客户端连接
  addClient(userId: number, ws: any) {
    const existing = this.clients.get(userId) || []
    existing.push({ userId, ws })
    this.clients.set(userId, existing)
    console.log(`WebSocket client connected: user ${userId}`)
  }

  // 移除客户端连接
  removeClient(userId: number, ws: any) {
    const existing = this.clients.get(userId)
    if (existing) {
      const filtered = existing.filter((client) => client.ws !== ws)
      if (filtered.length === 0) {
        this.clients.delete(userId)
      } else {
        this.clients.set(userId, filtered)
      }
    }
    console.log(`WebSocket client disconnected: user ${userId}`)
  }

  // 向特定用户发送消息
  sendToUser(userId: number, event: string, data: any) {
    const clients = this.clients.get(userId)
    if (clients) {
      const message = JSON.stringify({ event, data })
      clients.forEach((client) => {
        try {
          client.ws.send(message)
        } catch (error) {
          console.error(`Failed to send WebSocket message to user ${userId}:`, error)
          this.removeClient(userId, client.ws)
        }
      })
    }
  }

  // 广播消息给所有连接的用户
  broadcast(event: string, data: any) {
    const message = JSON.stringify({ event, data })
    this.clients.forEach((clients, userId) => {
      clients.forEach((client) => {
        try {
          client.ws.send(message)
        } catch (error) {
          console.error(`Failed to broadcast WebSocket message to user ${userId}:`, error)
          this.removeClient(userId, client.ws)
        }
      })
    })
  }

  // 获取在线用户数量
  getOnlineUserCount(): number {
    return this.clients.size
  }

  // 检查用户是否在线
  isUserOnline(userId: number): boolean {
    return this.clients.has(userId)
  }
}

// 单例模式
export const wsManager = new WebSocketManager()
