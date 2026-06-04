<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const unreadCount = ref(0)
const notifications = ref<any[]>([])
const isOpen = ref(false)
const loading = ref(false)

// 获取未读数量
async function fetchUnreadCount() {
  if (!authStore.isAuthenticated) return

  try {
    const data = await $fetch('/api/notifications/unread-count')
    unreadCount.value = (data as any).data.count
  } catch (error) {
    console.error('获取未读通知数量失败:', error)
  }
}

// 获取最新通知
async function fetchNotifications() {
  if (!authStore.isAuthenticated) return

  loading.value = true
  try {
    const data = await $fetch('/api/notifications?limit=5')
    notifications.value = (data as any).data.notifications
  } catch (error) {
    console.error('获取通知失败:', error)
  } finally {
    loading.value = false
  }
}

// 标记单个为已读
async function markAsRead(notification: any) {
  if (notification.isRead) return

  try {
    await $fetch('/api/notifications/read', {
      method: 'POST',
      body: { notificationId: notification.id },
    })
    notification.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 标记所有为已读
async function markAllAsRead() {
  try {
    await $fetch('/api/notifications/read', {
      method: 'POST',
      body: { all: true },
    })
    notifications.value.forEach((n) => {
      n.isRead = true
    })
    unreadCount.value = 0
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

// 点击通知
function handleNotificationClick(notification: any) {
  markAsRead(notification)
  if (notification.link) {
    isOpen.value = false
    router.push(notification.link)
  }
}

// 切换下拉菜单
function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value && notifications.value.length === 0) {
    fetchNotifications()
  }
}

// 点击外部关闭
function closeDropdown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.notification-bell')) {
    isOpen.value = false
  }
}

// 格式化时间
function formatTime(date: string) {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString()
}

// 获取通知图标
function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return '❤️'
    case 'comment':
      return '💬'
    case 'follow':
      return '👤'
    case 'system':
      return '📢'
    default:
      return '🔔'
  }
}

onMounted(() => {
  fetchUnreadCount()
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

// 定期刷新未读数量
let interval: ReturnType<typeof setInterval>
onMounted(() => {
  interval = setInterval(fetchUnreadCount, 60000) // 每分钟刷新
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div
    v-if="authStore.isAuthenticated"
    class="notification-bell"
  >
    <button
      class="bell-btn"
      @click.stop="toggleDropdown"
    >
      <span class="bell-icon">🔔</span>
      <span
        v-if="unreadCount > 0"
        class="badge"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- 下拉菜单 -->
    <div
      v-if="isOpen"
      class="notification-dropdown"
    >
      <div class="dropdown-header">
        <h3>通知</h3>
        <button
          v-if="unreadCount > 0"
          class="mark-all-btn"
          @click="markAllAsRead"
        >
          全部已读
        </button>
      </div>

      <div
        v-if="loading"
        class="dropdown-loading"
      >
        加载中...
      </div>

      <div
        v-else-if="notifications.length === 0"
        class="dropdown-empty"
      >
        暂无通知
      </div>

      <div
        v-else
        class="notification-list"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <span class="notification-icon">
            {{ getNotificationIcon(notification.type) }}
          </span>
          <div class="notification-content">
            <div class="notification-title">
              {{ notification.title }}
            </div>
            <div
              v-if="notification.content"
              class="notification-text"
            >
              {{ notification.content }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <div class="dropdown-footer">
        <NuxtLink
          to="/notifications"
          class="view-all-link"
          @click="isOpen = false"
        >
          查看全部通知
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.bell-btn:hover {
  background: var(--bg-secondary);
}

.bell-icon {
  font-size: 1.25rem;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.25rem;
  background: var(--color-danger);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 360px;
  max-height: 480px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.mark-all-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity var(--transition-fast);
}

.mark-all-btn:hover {
  opacity: 0.8;
}

.dropdown-loading,
.dropdown-empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.notification-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.notification-item:hover {
  background: var(--bg-secondary);
}

.notification-item.unread {
  background: var(--color-primary-light);
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.notification-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.dropdown-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.view-all-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity var(--transition-fast);
}

.view-all-link:hover {
  opacity: 0.8;
}
</style>
