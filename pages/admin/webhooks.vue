<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

interface Webhook {
  id: number
  name: string
  url: string
  secret: string | null
  isActive: boolean
  events: string[]
  createdAt: string
  _count: {
    deliveries: number
  }
}

interface Delivery {
  id: number
  event: string
  status: string
  statusCode: number | null
  response: string | null
  retryCount: number
  createdAt: string
  webhook: {
    id: number
    name: string
    url: string
  }
}

const webhooks = ref<Webhook[]>([])
const deliveries = ref<Delivery[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedWebhook = ref<Webhook | null>(null)
const activeTab = ref<'list' | 'logs'>('list')

// 新 Webhook 表单
const newWebhook = ref({
  name: '',
  url: '',
  secret: '',
  events: [] as string[],
})

// 可用的事件类型
const availableEvents = [
  { value: 'post.created', label: '文章创建' },
  { value: 'post.updated', label: '文章更新' },
  { value: 'post.deleted', label: '文章删除' },
  { value: 'post.published', label: '文章发布' },
  { value: 'comment.created', label: '评论创建' },
  { value: 'comment.approved', label: '评论批准' },
  { value: 'comment.rejected', label: '评论拒绝' },
  { value: 'user.registered', label: '用户注册' },
  { value: 'user.updated', label: '用户更新' },
  { value: 'user.banned', label: '用户封禁' },
]

// 获取 Webhook 列表
async function fetchWebhooks() {
  loading.value = true
  try {
    const response = await $fetch<{ data: Webhook[] }>('/api/webhooks')
    webhooks.value = response.data
  } catch (error) {
    console.error('获取 Webhook 列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取投递日志
async function fetchDeliveries() {
  loading.value = true
  try {
    const response = await $fetch<{ data: { deliveries: Delivery[] } }>('/api/webhooks/deliveries')
    deliveries.value = response.data.deliveries
  } catch (error) {
    console.error('获取投递日志失败:', error)
  } finally {
    loading.value = false
  }
}

// 创建 Webhook
async function handleCreate() {
  try {
    await $fetch('/api/webhooks', {
      method: 'POST',
      body: newWebhook.value,
    })
    showCreateModal.value = false
    newWebhook.value = { name: '', url: '', secret: '', events: [] }
    await fetchWebhooks()
  } catch (error) {
    console.error('创建 Webhook 失败:', error)
    alert('创建失败，请检查输入')
  }
}

// 编辑 Webhook
function handleEdit(webhook: Webhook) {
  selectedWebhook.value = { ...webhook }
  showEditModal.value = true
}

// 更新 Webhook
async function handleUpdate() {
  if (!selectedWebhook.value) return

  try {
    await $fetch(`/api/webhooks/${selectedWebhook.value.id}`, {
      method: 'PUT',
      body: selectedWebhook.value,
    })
    showEditModal.value = false
    selectedWebhook.value = null
    await fetchWebhooks()
  } catch (error) {
    console.error('更新 Webhook 失败:', error)
    alert('更新失败')
  }
}

// 删除 Webhook
async function handleDelete(id: number) {
  if (!confirm('确定要删除这个 Webhook 吗？')) return

  try {
    await $fetch(`/api/webhooks/${id}`, {
      method: 'DELETE',
    })
    await fetchWebhooks()
  } catch (error) {
    console.error('删除 Webhook 失败:', error)
    alert('删除失败')
  }
}

// 测试 Webhook
async function handleTest(id: number) {
  try {
    const response = await $fetch<{ data: { success: boolean; statusCode?: number } }>(
      `/api/webhooks/${id}/test`,
      { method: 'POST' },
    )
    alert(response.data.success ? '测试成功！' : `测试失败: ${response.data.statusCode}`)
  } catch (error) {
    console.error('测试 Webhook 失败:', error)
    alert('测试失败')
  }
}

// 重试失败的投递
async function handleRetry() {
  try {
    const response = await $fetch<{ data: { retried: number } }>('/api/webhooks/retry', {
      method: 'POST',
    })
    alert(`已重试 ${response.data.retried} 个失败的投递`)
    await fetchDeliveries()
  } catch (error) {
    console.error('重试失败:', error)
    alert('重试失败')
  }
}

// 切换 Webhook 状态
async function toggleWebhook(webhook: Webhook) {
  try {
    await $fetch(`/api/webhooks/${webhook.id}`, {
      method: 'PUT',
      body: { isActive: !webhook.isActive },
    })
    await fetchWebhooks()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
}

// 格式化状态
function formatStatus(status: string) {
  const statusMap: Record<string, { label: string; class: string }> = {
    PENDING: { label: '等待中', class: 'status-pending' },
    SUCCESS: { label: '成功', class: 'status-success' },
    FAILED: { label: '失败', class: 'status-failed' },
    RETRYING: { label: '重试中', class: 'status-retrying' },
  }
  return statusMap[status] || { label: status, class: '' }
}

// 初始化
onMounted(() => {
  fetchWebhooks()
})
</script>

<template>
  <div class="webhooks-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Webhook 管理</h1>
        <p class="page-description">管理外部系统集成和事件推送</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          @click="handleRetry"
        >
          重试失败
        </button>
        <button
          class="btn btn-primary"
          @click="showCreateModal = true"
        >
          添加 Webhook
        </button>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'list' }]"
        @click="activeTab = 'list'"
      >
        Webhook 列表
      </button>
      <button
        :class="['tab', { active: activeTab === 'logs' }]"
        @click="
          activeTab = 'logs'
          fetchDeliveries()
        "
      >
        投递日志
      </button>
    </div>

    <!-- Webhook 列表 -->
    <div
      v-if="activeTab === 'list'"
      class="webhooks-list"
    >
      <div
        v-if="loading"
        class="loading"
      >
        加载中...
      </div>

      <div
        v-else-if="webhooks.length === 0"
        class="empty-state"
      >
        <p>暂无 Webhook 配置</p>
      </div>

      <div
        v-else
        class="webhooks-grid"
      >
        <div
          v-for="webhook in webhooks"
          :key="webhook.id"
          :class="['webhook-card', { inactive: !webhook.isActive }]"
        >
          <div class="webhook-header">
            <div class="webhook-info">
              <h3>{{ webhook.name }}</h3>
              <span :class="['status-badge', webhook.isActive ? 'active' : 'inactive']">
                {{ webhook.isActive ? '启用' : '禁用' }}
              </span>
            </div>
            <div class="webhook-actions">
              <button
                class="btn-icon"
                title="测试"
                @click="handleTest(webhook.id)"
              >
                🧪
              </button>
              <button
                class="btn-icon"
                title="编辑"
                @click="handleEdit(webhook)"
              >
                ✏️
              </button>
              <button
                class="btn-icon"
                title="删除"
                @click="handleDelete(webhook.id)"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="webhook-url">
            {{ webhook.url }}
          </div>

          <div class="webhook-events">
            <span
              v-for="event in webhook.events"
              :key="event"
              class="event-tag"
            >
              {{ event }}
            </span>
          </div>

          <div class="webhook-footer">
            <span class="delivery-count"> 投递次数: {{ webhook._count.deliveries }} </span>
            <button
              class="btn-text"
              @click="toggleWebhook(webhook)"
            >
              {{ webhook.isActive ? '禁用' : '启用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 投递日志 -->
    <div
      v-if="activeTab === 'logs'"
      class="deliveries-list"
    >
      <div
        v-if="loading"
        class="loading"
      >
        加载中...
      </div>

      <div
        v-else-if="deliveries.length === 0"
        class="empty-state"
      >
        <p>暂无投递记录</p>
      </div>

      <table
        v-else
        class="table"
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Webhook</th>
            <th>事件</th>
            <th>状态</th>
            <th>HTTP 状态码</th>
            <th>重试次数</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="delivery in deliveries"
            :key="delivery.id"
          >
            <td>{{ delivery.id }}</td>
            <td>{{ delivery.webhook.name }}</td>
            <td>
              <span class="event-tag">{{ delivery.event }}</span>
            </td>
            <td>
              <span :class="['status-badge', formatStatus(delivery.status).class]">
                {{ formatStatus(delivery.status).label }}
              </span>
            </td>
            <td>{{ delivery.statusCode || '-' }}</td>
            <td>{{ delivery.retryCount }}</td>
            <td>{{ new Date(delivery.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 创建 Webhook 模态框 -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="modal-overlay"
        @click.self="showCreateModal = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>添加 Webhook</h2>
            <button
              class="btn-close"
              @click="showCreateModal = false"
            >
              ×
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input
                v-model="newWebhook.name"
                type="text"
                class="form-input"
                placeholder="My Webhook"
              />
            </div>

            <div class="form-group">
              <label class="form-label">URL</label>
              <input
                v-model="newWebhook.url"
                type="url"
                class="form-input"
                placeholder="https://example.com/webhook"
              />
            </div>

            <div class="form-group">
              <label class="form-label">密钥 (可选)</label>
              <input
                v-model="newWebhook.secret"
                type="text"
                class="form-input"
                placeholder="用于签名验证"
              />
            </div>

            <div class="form-group">
              <label class="form-label">订阅事件</label>
              <div class="events-grid">
                <label
                  v-for="evt in availableEvents"
                  :key="evt.value"
                  class="event-checkbox"
                >
                  <input
                    v-model="newWebhook.events"
                    type="checkbox"
                    :value="evt.value"
                  />
                  <span>{{ evt.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="showCreateModal = false"
            >
              取消
            </button>
            <button
              class="btn btn-primary"
              @click="handleCreate"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑 Webhook 模态框 -->
    <Teleport to="body">
      <div
        v-if="showEditModal && selectedWebhook"
        class="modal-overlay"
        @click.self="showEditModal = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>编辑 Webhook</h2>
            <button
              class="btn-close"
              @click="showEditModal = false"
            >
              ×
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input
                v-model="selectedWebhook.name"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">URL</label>
              <input
                v-model="selectedWebhook.url"
                type="url"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">密钥</label>
              <input
                v-model="selectedWebhook.secret"
                type="text"
                class="form-input"
                placeholder="留空则不使用签名"
              />
            </div>

            <div class="form-group">
              <label class="form-label">订阅事件</label>
              <div class="events-grid">
                <label
                  v-for="evt in availableEvents"
                  :key="evt.value"
                  class="event-checkbox"
                >
                  <input
                    v-model="selectedWebhook.events"
                    type="checkbox"
                    :value="evt.value"
                  />
                  <span>{{ evt.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="showEditModal = false"
            >
              取消
            </button>
            <button
              class="btn btn-primary"
              @click="handleUpdate"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.webhooks-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.page-description {
  color: var(--text-secondary);
  margin: 0.5rem 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.webhooks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.webhook-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  transition: all var(--transition-fast);
}

.webhook-card.inactive {
  opacity: 0.7;
}

.webhook-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.webhook-info h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.webhook-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.btn-icon:hover {
  opacity: 1;
}

.webhook-url {
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
  word-break: break-all;
}

.webhook-events {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.event-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
}

.webhook-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.delivery-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.status-badge.active {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-badge.inactive {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-badge.status-pending {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-badge.status-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-badge.status-failed {
  background: var(--color-error-light);
  color: var(--color-error);
}

.status-badge.status-retrying {
  background: var(--color-info-light);
  color: var(--color-info);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  font-weight: 600;
  background: var(--bg-secondary);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.event-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-text:hover {
  text-decoration: underline;
}
</style>
