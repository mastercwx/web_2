/**
 * WebSocket 连接管理 composable
 * 用于实时通知推送
 */

export function useWebSocket() {
  const authStore = useAuthStore()

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 1000

  // 事件监听器
  const listeners = new Map<string, Set<(data: any) => void>>()

  // 连接 WebSocket
  function connect() {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/_ws/notifications?userId=${authStore.user.id}`

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        console.log('WebSocket connected')
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const eventListeners = listeners.get(data.event)
          if (eventListeners) {
            eventListeners.forEach((listener) => listener(data.data))
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.value.onclose = () => {
        isConnected.value = false
        console.log('WebSocket disconnected')

        // 自动重连
        if (reconnectAttempts.value < maxReconnectAttempts) {
          setTimeout(
            () => {
              reconnectAttempts.value++
              connect()
            },
            reconnectDelay * Math.pow(2, reconnectAttempts.value),
          )
        }
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  // 断开连接
  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
    }
  }

  // 监听事件
  function on(event: string, callback: (data: any) => void) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(callback)

    // 返回取消监听函数
    return () => {
      listeners.get(event)?.delete(callback)
    }
  }

  // 发送消息
  function send(event: string, data: any) {
    if (ws.value && isConnected.value) {
      ws.value.send(JSON.stringify({ event, data }))
    }
  }

  // 监听通知事件
  function onNotification(callback: (notification: any) => void) {
    return on('notification', callback)
  }

  // 监听未读数量更新
  function onUnreadCount(callback: (data: { count: number }) => void) {
    return on('unread-count', callback)
  }

  // 自动连接/断开
  watch(
    () => authStore.isAuthenticated,
    (isLoggedIn) => {
      if (isLoggedIn) {
        connect()
      } else {
        disconnect()
      }
    },
    { immediate: true },
  )

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    connect,
    disconnect,
    on,
    send,
    onNotification,
    onUnreadCount,
  }
}
