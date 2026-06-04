<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const { t } = useI18n()

// 筛选条件
const filters = reactive({
  userId: '',
  action: '',
  entity: '',
  search: '',
  startDate: '',
  endDate: '',
})

const page = ref(1)
const limit = ref(20)

// 获取活动日志
const { data: logsData } = await useFetch('/api/admin/activity-logs', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    userId: filters.userId || undefined,
    action: filters.action || undefined,
    entity: filters.entity || undefined,
    search: filters.search || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  })),
})

// 获取统计数据
const { data: statsData } = await useFetch('/api/admin/activity-logs/stats', {
  query: { days: 7 },
})

// 操作类型映射
const actionLabels: Record<string, string> = {
  login: '登录',
  logout: '登出',
  register: '注册',
  password_change: '修改密码',
  password_reset: '重置密码',
  email_verify: '邮箱验证',
  post_create: '创建文章',
  post_update: '更新文章',
  post_delete: '删除文章',
  post_publish: '发布文章',
  post_archive: '归档文章',
  comment_create: '发表评论',
  comment_update: '编辑评论',
  comment_delete: '删除评论',
  like: '点赞',
  unlike: '取消点赞',
  favorite: '收藏',
  unfavorite: '取消收藏',
  follow: '关注',
  unfollow: '取消关注',
  user_ban: '封禁用户',
  user_unban: '解封用户',
  user_role_change: '修改角色',
  settings_update: '更新设置',
  media_upload: '上传媒体',
  media_delete: '删除媒体',
}

// 实体类型映射
const entityLabels: Record<string, string> = {
  user: '用户',
  post: '文章',
  comment: '评论',
  media: '媒体',
  settings: '设置',
}

// 操作类型颜色
const actionColors: Record<string, string> = {
  login: 'text-green-600 bg-green-50',
  logout: 'text-gray-600 bg-gray-50',
  register: 'text-blue-600 bg-blue-50',
  post_create: 'text-blue-600 bg-blue-50',
  post_update: 'text-yellow-600 bg-yellow-50',
  post_delete: 'text-red-600 bg-red-50',
  post_publish: 'text-green-600 bg-green-50',
  comment_create: 'text-purple-600 bg-purple-50',
  like: 'text-pink-600 bg-pink-50',
  unlike: 'text-gray-600 bg-gray-50',
  favorite: 'text-orange-600 bg-orange-50',
  follow: 'text-indigo-600 bg-indigo-50',
  user_ban: 'text-red-600 bg-red-50',
  user_unban: 'text-green-600 bg-green-50',
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

// 获取操作标签
function getActionLabel(action: string) {
  return actionLabels[action] || action
}

// 获取实体标签
function getEntityLabel(entity: string | null) {
  if (!entity) return '-'
  return entityLabels[entity] || entity
}

// 获取操作颜色类
function getActionColor(action: string) {
  return actionColors[action] || 'text-gray-600 bg-gray-50'
}

// 重置筛选
function resetFilters() {
  filters.userId = ''
  filters.action = ''
  filters.entity = ''
  filters.search = ''
  filters.startDate = ''
  filters.endDate = ''
  page.value = 1
}

// 分页
function prevPage() {
  if (page.value > 1) page.value--
}

function nextPage() {
  if (logsData.value && page.value < logsData.value.pagination.pages) page.value++
}

// 活动类型选项
const actionOptions = Object.entries(actionLabels).map(([value, label]) => ({ value, label }))

const entityOptions = Object.entries(entityLabels).map(([value, label]) => ({ value, label }))
</script>

<template>
  <div class="activity-page">
    <div class="page-header">
      <h1 class="page-title">
        {{ t('admin.activityLogs') || '活动日志' }}
      </h1>
      <p class="page-description">
        {{ t('admin.activityLogsDesc') || '查看用户操作记录和系统审计日志' }}
      </p>
    </div>

    <!-- 统计卡片 -->
    <div
      v-if="statsData"
      class="stats-grid"
    >
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">
            {{ statsData.recentActivityCount }}
          </div>
          <div class="stat-label">
            {{ t('admin.last24Hours') || '最近24小时' }}
          </div>
        </div>
      </div>

      <div
        v-for="stat in statsData.actionStats.slice(0, 4)"
        :key="stat.action"
        class="stat-card"
      >
        <div class="stat-icon">
          {{
            stat.action.includes('login')
              ? '🔑'
              : stat.action.includes('post')
                ? '📝'
                : stat.action.includes('comment')
                  ? '💬'
                  : '⚡'
          }}
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ stat.count }}
          </div>
          <div class="stat-label">
            {{ getActionLabel(stat.action) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('admin.actionType') || '操作类型' }}</label>
          <select
            v-model="filters.action"
            class="filter-input"
          >
            <option value="">
              {{ t('common.all') || '全部' }}
            </option>
            <option
              v-for="opt in actionOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('admin.entityType') || '实体类型' }}</label>
          <select
            v-model="filters.entity"
            class="filter-input"
          >
            <option value="">
              {{ t('common.all') || '全部' }}
            </option>
            <option
              v-for="opt in entityOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('common.search') || '搜索' }}</label>
          <input
            v-model="filters.search"
            type="text"
            class="filter-input"
            :placeholder="t('admin.searchLogs') || '搜索日志内容...'"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('admin.startDate') || '开始日期' }}</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ t('admin.endDate') || '结束日期' }}</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="filter-input"
          />
        </div>

        <div class="filter-actions">
          <button
            class="btn btn-secondary"
            @click="resetFilters"
          >
            {{ t('common.reset') || '重置' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 活动日志列表 -->
    <div class="logs-section">
      <div
        v-if="!logsData?.logs.length"
        class="empty-state"
      >
        <div class="empty-icon">📋</div>
        <p>{{ t('admin.noLogs') || '暂无活动日志' }}</p>
      </div>

      <div
        v-else
        class="logs-table-wrapper"
      >
        <table class="logs-table">
          <thead>
            <tr>
              <th>{{ t('admin.time') || '时间' }}</th>
              <th>{{ t('admin.user') || '用户' }}</th>
              <th>{{ t('admin.action') || '操作' }}</th>
              <th>{{ t('admin.entity') || '实体' }}</th>
              <th>{{ t('admin.details') || '详情' }}</th>
              <th>{{ t('admin.ipAddress') || 'IP地址' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in logsData.logs"
              :key="log.id"
            >
              <td class="time-cell">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="user-cell">
                <div
                  v-if="log.user"
                  class="user-info"
                >
                  <img
                    v-if="log.user.avatar"
                    :src="log.user.avatar"
                    :alt="log.user.username"
                    class="user-avatar"
                  />
                  <span>{{ log.user.username }}</span>
                </div>
                <span
                  v-else
                  class="text-muted"
                  >{{ t('admin.system') || '系统' }}</span
                >
              </td>
              <td>
                <span
                  class="action-badge"
                  :class="getActionColor(log.action)"
                >
                  {{ getActionLabel(log.action) }}
                </span>
              </td>
              <td>{{ getEntityLabel(log.entity) }}</td>
              <td class="details-cell">
                {{ log.details || '-' }}
              </td>
              <td class="ip-cell">
                {{ log.ipAddress || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div
        v-if="logsData && logsData.pagination.pages > 1"
        class="pagination"
      >
        <button
          class="pagination-btn"
          :disabled="page <= 1"
          @click="prevPage"
        >
          {{ t('common.prev') || '上一页' }}
        </button>
        <span class="pagination-info"> {{ page }} / {{ logsData.pagination.pages }} </span>
        <button
          class="pagination-btn"
          :disabled="page >= logsData.pagination.pages"
          @click="nextPage"
        >
          {{ t('common.next') || '下一页' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-page {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: var(--text-secondary);
  margin: 0;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  border: 1px solid(--border-color);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 筛选器 */
.filters-section {
  background: var(--bg-primary);
  border: 1px solid(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.filter-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.filter-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: end;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

/* 日志表格 */
.logs-section {
  background: var(--bg-primary);
  border: 1px solid(--border-color);
  border-radius: 0.75rem;
  overflow: hidden;
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.logs-table-wrapper {
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.logs-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.logs-table tr:last-child td {
  border-bottom: none;
}

.logs-table tr:hover {
  background: var(--bg-secondary);
}

.time-cell {
  white-space: nowrap;
  font-size: 0.8125rem;
}

.user-cell {
  min-width: 120px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.action-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.details-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-cell {
  font-family: monospace;
  font-size: 0.8125rem;
}

.text-muted {
  color: var(--text-secondary);
  font-style: italic;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
