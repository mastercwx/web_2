<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const notifications = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const unreadCount = ref(0)

// 获取通知列表
async function fetchNotifications() {
  loading.value = true
  try {
    const data = await $fetch(`/api/notifications?page=${page.value}&limit=20`)
    const result = (data as any).data
    notifications.value = result.notifications
    totalPages.value = result.totalPages
    unreadCount.value = result.unreadCount
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

// 删除通知
async function deleteNotification(id: number) {
  try {
    await $fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
    })
    notifications.value = notifications.value.filter((n) => n.id !== id)
  } catch (error) {
    console.error('删除通知失败:', error)
  }
}

// 点击通知
function handleNotificationClick(notification: any) {
  markAsRead(notification)
  if (notification.link) {
    router.push(notification.link)
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

// 翻页
function prevPage() {
  if (page.value > 1) {
    page.value--
    fetchNotifications()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    fetchNotifications()
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  fetchNotifications()
})
</script>

<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1>通知中心</h1>
      <div class="header-actions">
        <span
          v-if="unreadCount > 0"
          class="unread-count"
        >
          {{ unreadCount }} 条未读
        </span>
        <button
          v-if="unreadCount > 0"
          class="btn-mark-all"
          @click="markAllAsRead"
        >
          全部已读
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading-state"
    >
      加载中...
    </div>

    <div
      v-else-if="notifications.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">🔔</div>
      <p>暂无通知</p>
    </div>

    <div
      v-else
      class="notification-list"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        :class="{ unread: !notification.isRead }"
      >
        <div
          class="notification-main"
          @click="handleNotificationClick(notification)"
        >
          <span class="notification-icon">
            {{ getNotificationIcon(notification.type) }}
          </span>
          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-title">{{ notification.title }}</span>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
            <div
              v-if="notification.content"
              class="notification-text"
            >
              {{ notification.content }}
            </div>
            <div
              v-if="notification.actor"
              class="notification-actor"
            >
              <img
                v-if="notification.actor.avatar"
                :src="notification.actor.avatar"
                :alt="notification.actor.username"
                class="actor-avatar"
              />
              <span class="actor-name">{{ notification.actor.username }}</span>
            </div>
          </div>
        </div>
        <button
          class="btn-delete"
          title="删除"
          @click="deleteNotification(notification.id)"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 分页 -->
    <div
      v-if="totalPages > 1"
      class="pagination"
    >
      <button
        :disabled="page <= 1"
        @click="prevPage"
      >
        上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button
        :disabled="page >= totalPages"
        @click="nextPage"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.unread-count {
  font-size: 0.875rem;
  color: var(--color-primary);
  font-weight: 500;
}

.btn-mark-all {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.btn-mark-all:hover {
  background: var(--color-primary);
  color: white;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1rem;
  transition: all var(--transition-fast);
}

.notification-card:hover {
  box-shadow: var(--shadow-md);
}

.notification-card.unread {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.notification-main {
  flex: 1;
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.notification-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.notification-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.notification-actor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actor-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.actor-name {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.btn-delete {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.btn-delete:hover {
  background: var(--bg-secondary);
  color: var(--color-danger);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
