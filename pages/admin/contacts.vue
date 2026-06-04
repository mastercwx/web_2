<template>
  <div class="contacts-page">
    <div class="page-header">
      <h1>联系消息</h1>
      <div class="header-actions">
        <button
          class="filter-btn"
          :class="{ active: showUnreadOnly }"
          @click="showUnreadOnly = !showUnreadOnly"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          {{ showUnreadOnly ? '显示全部' : `未读 (${unreadCount})` }}
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-list">
      <div
        v-if="loading"
        class="loading"
      >
        加载中...
      </div>

      <div
        v-else-if="messages.length === 0"
        class="empty"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <p>暂无联系消息</p>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        class="message-card"
        :class="{ unread: !message.read }"
        @click="selectedMessage = message"
      >
        <div class="message-header">
          <div class="message-sender">
            <span class="sender-name">{{ message.name }}</span>
            <span class="sender-email">&lt;{{ message.email }}&gt;</span>
          </div>
          <div class="message-meta">
            <span class="message-date">{{ formatDate(message.createdAt) }}</span>
            <span
              v-if="!message.read"
              class="unread-badge"
              >未读</span
            >
          </div>
        </div>
        <div class="message-subject">
          {{ message.subject || '无主题' }}
        </div>
        <div class="message-preview">
          {{ message.content.substring(0, 100) }}{{ message.content.length > 100 ? '...' : '' }}
        </div>
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

    <!-- 消息详情弹窗 -->
    <Teleport to="body">
      <div
        v-if="selectedMessage"
        class="modal-overlay"
        @click.self="selectedMessage = null"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>消息详情</h2>
            <button
              class="close-btn"
              @click="selectedMessage = null"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="detail-row">
              <label>发件人</label>
              <span>{{ selectedMessage.name }}</span>
            </div>
            <div class="detail-row">
              <label>邮箱</label>
              <a :href="`mailto:${selectedMessage.email}`">{{ selectedMessage.email }}</a>
            </div>
            <div class="detail-row">
              <label>主题</label>
              <span>{{ selectedMessage.subject || '无主题' }}</span>
            </div>
            <div class="detail-row">
              <label>时间</label>
              <span>{{ formatDate(selectedMessage.createdAt) }}</span>
            </div>
            <div class="detail-content">
              <label>内容</label>
              <div class="content-text">
                {{ selectedMessage.content }}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              v-if="!selectedMessage.read"
              class="btn-primary"
              @click="markAsRead(selectedMessage)"
            >
              标记已读
            </button>
            <a
              :href="`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || ''}`"
              class="btn-secondary"
            >
              回复邮件
            </a>
            <button
              class="btn-danger"
              @click="deleteMessage(selectedMessage)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

// 检查管理员权限
if (!authStore.isAdmin) {
  throw createError({ statusCode: 403, message: '无权访问' })
}

// 设置页面 SEO
useSeo({ title: '联系消息管理' })

const messages = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const unreadCount = ref(0)
const showUnreadOnly = ref(false)
const selectedMessage = ref<any>(null)

// 翻页
function prevPage() {
  if (page.value > 1) {
    page.value--
    loadMessages()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    loadMessages()
  }
}

// 加载消息
async function loadMessages() {
  loading.value = true
  try {
    const result = await $fetch('/api/admin/contacts', {
      headers: useRequestHeaders(['cookie']),
      params: {
        page: page.value,
        pageSize: 20,
        unread: showUnreadOnly.value ? 'true' : 'false',
      },
    })
    messages.value = result.messages
    totalPages.value = result.totalPages
    unreadCount.value = result.unreadCount
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    loading.value = false
  }
}

// 标记已读
async function markAsRead(message: any) {
  try {
    await $fetch(`/api/admin/contacts/${message.id}/read`, {
      method: 'PUT',
      headers: useRequestHeaders(['cookie']),
    })
    message.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 删除消息
async function deleteMessage(message: any) {
  if (!confirm('确定要删除这条消息吗？')) {
    return
  }

  try {
    await $fetch(`/api/admin/contacts/${message.id}`, {
      method: 'DELETE',
      headers: useRequestHeaders(['cookie']),
    })
    messages.value = messages.value.filter((m) => m.id !== message.id)
    selectedMessage.value = null
    if (!message.read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (error) {
    console.error('删除消息失败:', error)
  }
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 监听筛选变化
watch(showUnreadOnly, () => {
  page.value = 1
  loadMessages()
})

// 初始加载
onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.contacts-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-tertiary);
}

.filter-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.filter-btn svg {
  width: 16px;
  height: 16px;
}

/* 消息列表 */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty svg {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.message-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.message-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.message-card.unread {
  border-left: 4px solid var(--primary);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sender-name {
  font-weight: 600;
  color: var(--text-primary);
}

.sender-email {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.message-date {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.unread-badge {
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.message-subject {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.message-preview {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  background: var(--bg-primary);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  margin-bottom: 1rem;
}

.detail-row label {
  width: 80px;
  font-size: 0.875rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.detail-row span,
.detail-row a {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.detail-row a {
  color: var(--primary);
  text-decoration: none;
}

.detail-row a:hover {
  text-decoration: underline;
}

.detail-content {
  margin-top: 1.5rem;
}

.detail-content label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.content-text {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
}

/* 响应式 */
@media (max-width: 768px) {
  .contacts-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
    justify-content: center;
  }
}
</style>
