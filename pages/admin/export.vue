<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const { t } = useI18n()

// 导出配置
const exportConfig = reactive({
  users: { enabled: true, format: 'json' },
  posts: { enabled: true, format: 'json' },
  comments: { enabled: true, format: 'json' },
  media: { enabled: true, format: 'json' },
})

const loading = ref(false)
const exportProgress = ref<string[]>([])

// 导出数据
async function exportData(type: string, format: string) {
  loading.value = true
  exportProgress.value.push(`开始导出 ${getTypeLabel(type)}...`)

  try {
    // 创建下载链接
    const url = `/api/admin/export/${type}?format=${format}`
    const link = document.createElement('a')
    link.href = url
    link.download = ''

    // 添加认证头
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`)
    }

    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export.${format}`

    // 下载文件
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)

    exportProgress.value.push(`✅ ${getTypeLabel(type)} 导出成功`)
  } catch (error: any) {
    exportProgress.value.push(`❌ ${getTypeLabel(type)} 导出失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 批量导出
async function exportAll() {
  loading.value = true
  exportProgress.value = ['开始批量导出...']

  const types = Object.entries(exportConfig)
    .filter(([_, config]) => config.enabled)
    .map(([type, config]) => ({ type, format: config.format }))

  if (types.length === 0) {
    exportProgress.value.push('❌ 请选择至少一种数据类型')
    loading.value = false
    return
  }

  for (const { type, format } of types) {
    await exportData(type, format)
  }

  exportProgress.value.push('批量导出完成')
  loading.value = false
}

// 获取类型标签
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    users: '用户数据',
    posts: '文章数据',
    comments: '评论数据',
    media: '媒体数据',
  }
  return labels[type] || type
}

// 清除进度
function clearProgress() {
  exportProgress.value = []
}
</script>

<template>
  <div class="export-page">
    <div class="page-header">
      <h1 class="page-title">
        {{ t('admin.export.title') || '数据导出' }}
      </h1>
      <p class="page-description">
        {{ t('admin.export.description') || '导出系统数据为 JSON 或 CSV 格式' }}
      </p>
    </div>

    <div class="export-grid">
      <!-- 用户数据 -->
      <div class="export-card">
        <div class="card-header">
          <div class="card-icon">👥</div>
          <div class="card-info">
            <h3 class="card-title">
              {{ t('admin.export.users') || '用户数据' }}
            </h3>
            <p class="card-desc">
              {{ t('admin.export.usersDesc') || '导出所有用户信息' }}
            </p>
          </div>
        </div>
        <div class="card-options">
          <div class="format-options">
            <label class="format-label">
              <input
                v-model="exportConfig.users.format"
                type="radio"
                value="json"
              />
              JSON
            </label>
            <label class="format-label">
              <input
                v-model="exportConfig.users.format"
                type="radio"
                value="csv"
              />
              CSV
            </label>
          </div>
          <button
            class="export-btn"
            :disabled="loading"
            @click="exportData('users', exportConfig.users.format)"
          >
            {{ t('admin.export.export') || '导出' }}
          </button>
        </div>
      </div>

      <!-- 文章数据 -->
      <div class="export-card">
        <div class="card-header">
          <div class="card-icon">📝</div>
          <div class="card-info">
            <h3 class="card-title">
              {{ t('admin.export.posts') || '文章数据' }}
            </h3>
            <p class="card-desc">
              {{ t('admin.export.postsDesc') || '导出所有文章信息' }}
            </p>
          </div>
        </div>
        <div class="card-options">
          <div class="format-options">
            <label class="format-label">
              <input
                v-model="exportConfig.posts.format"
                type="radio"
                value="json"
              />
              JSON
            </label>
            <label class="format-label">
              <input
                v-model="exportConfig.posts.format"
                type="radio"
                value="csv"
              />
              CSV
            </label>
          </div>
          <button
            class="export-btn"
            :disabled="loading"
            @click="exportData('posts', exportConfig.posts.format)"
          >
            {{ t('admin.export.export') || '导出' }}
          </button>
        </div>
      </div>

      <!-- 评论数据 -->
      <div class="export-card">
        <div class="card-header">
          <div class="card-icon">💬</div>
          <div class="card-info">
            <h3 class="card-title">
              {{ t('admin.export.comments') || '评论数据' }}
            </h3>
            <p class="card-desc">
              {{ t('admin.export.commentsDesc') || '导出所有评论信息' }}
            </p>
          </div>
        </div>
        <div class="card-options">
          <div class="format-options">
            <label class="format-label">
              <input
                v-model="exportConfig.comments.format"
                type="radio"
                value="json"
              />
              JSON
            </label>
            <label class="format-label">
              <input
                v-model="exportConfig.comments.format"
                type="radio"
                value="csv"
              />
              CSV
            </label>
          </div>
          <button
            class="export-btn"
            :disabled="loading"
            @click="exportData('comments', exportConfig.comments.format)"
          >
            {{ t('admin.export.export') || '导出' }}
          </button>
        </div>
      </div>

      <!-- 媒体数据 -->
      <div class="export-card">
        <div class="card-header">
          <div class="card-icon">🖼️</div>
          <div class="card-info">
            <h3 class="card-title">
              {{ t('admin.export.media') || '媒体数据' }}
            </h3>
            <p class="card-desc">
              {{ t('admin.export.mediaDesc') || '导出所有媒体文件信息' }}
            </p>
          </div>
        </div>
        <div class="card-options">
          <div class="format-options">
            <label class="format-label">
              <input
                v-model="exportConfig.media.format"
                type="radio"
                value="json"
              />
              JSON
            </label>
            <label class="format-label">
              <input
                v-model="exportConfig.media.format"
                type="radio"
                value="csv"
              />
              CSV
            </label>
          </div>
          <button
            class="export-btn"
            :disabled="loading"
            @click="exportData('media', exportConfig.media.format)"
          >
            {{ t('admin.export.export') || '导出' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量导出 -->
    <div class="batch-section">
      <div class="batch-header">
        <h2 class="batch-title">
          {{ t('admin.export.batchExport') || '批量导出' }}
        </h2>
        <p class="batch-desc">
          {{ t('admin.export.batchDesc') || '一次性导出所有选中的数据' }}
        </p>
      </div>

      <div class="batch-options">
        <label class="checkbox-label">
          <input
            v-model="exportConfig.users.enabled"
            type="checkbox"
          />
          {{ t('admin.export.users') || '用户' }}
        </label>
        <label class="checkbox-label">
          <input
            v-model="exportConfig.posts.enabled"
            type="checkbox"
          />
          {{ t('admin.export.posts') || '文章' }}
        </label>
        <label class="checkbox-label">
          <input
            v-model="exportConfig.comments.enabled"
            type="checkbox"
          />
          {{ t('admin.export.comments') || '评论' }}
        </label>
        <label class="checkbox-label">
          <input
            v-model="exportConfig.media.enabled"
            type="checkbox"
          />
          {{ t('admin.export.media') || '媒体' }}
        </label>
      </div>

      <div class="batch-actions">
        <button
          class="batch-btn"
          :disabled="loading"
          @click="exportAll"
        >
          {{
            loading ? t('common.loading') || '导出中...' : t('admin.export.exportAll') || '导出全部'
          }}
        </button>
        <button
          class="clear-btn"
          @click="clearProgress"
        >
          {{ t('admin.export.clearProgress') || '清除日志' }}
        </button>
      </div>
    </div>

    <!-- 导出进度 -->
    <div
      v-if="exportProgress.length > 0"
      class="progress-section"
    >
      <h3 class="progress-title">
        {{ t('admin.export.progress') || '导出日志' }}
      </h3>
      <div class="progress-log">
        <div
          v-for="(log, index) in exportProgress"
          :key="index"
          class="log-item"
        >
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-page {
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

/* 导出网格 */
.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.export-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.export-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.card-icon {
  font-size: 2.5rem;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.card-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.card-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.format-options {
  display: flex;
  gap: 1rem;
}

.format-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
}

.format-label input[type='radio'] {
  margin: 0;
}

.export-btn {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.export-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 批量导出 */
.batch-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.batch-header {
  margin-bottom: 1.5rem;
}

.batch-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.batch-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.batch-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  margin: 0;
}

.batch-actions {
  display: flex;
  gap: 1rem;
}

.batch-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.batch-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: var(--bg-tertiary);
}

/* 导出进度 */
.progress-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.progress-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.progress-log {
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.log-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .export-grid {
    grid-template-columns: 1fr;
  }

  .batch-options {
    flex-direction: column;
  }
}
</style>
