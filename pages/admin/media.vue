<template>
  <div class="media-page">
    <div class="page-header">
      <h1>{{ t('admin.media.title') }}</h1>
      <button
        class="upload-btn"
        @click="showUpload = true"
      >
        {{ t('admin.media.upload') }}
      </button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">{{ t('admin.media.totalFiles') }}</span>
        <span class="stat-value">{{ stats.totalFiles }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ t('admin.media.totalSize') }}</span>
        <span class="stat-value">{{ formatSize(stats.totalSize) }}</span>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <div class="filter-group">
        <select
          v-model="filterType"
          class="filter-select"
          @change="loadFiles"
        >
          <option value="">
            {{ t('admin.media.allTypes') }}
          </option>
          <option value="image">
            {{ t('admin.media.images') }}
          </option>
          <option value="video">
            {{ t('admin.media.videos') }}
          </option>
          <option value="document">
            {{ t('admin.media.documents') }}
          </option>
        </select>
      </div>

      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('admin.media.searchPlaceholder')"
          class="search-input"
          @keyup.enter="loadFiles"
        />
        <button
          class="search-btn"
          @click="loadFiles"
        >
          {{ t('common.search') }}
        </button>
      </div>
    </div>

    <!-- 文件列表 -->
    <div
      v-if="loading"
      class="loading"
    >
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="files.length === 0"
      class="empty"
    >
      {{ t('admin.media.noFiles') }}
    </div>

    <div
      v-else
      class="files-grid"
    >
      <div
        v-for="file in files"
        :key="file.id"
        class="file-card"
        :class="{ selected: selectedFiles.includes(file.id) }"
        @click="toggleSelect(file.id)"
      >
        <!-- 文件预览 -->
        <div class="file-preview">
          <img
            v-if="file.mimeType.startsWith('image/')"
            :src="file.url"
            :alt="file.alt || file.originalName"
          />
          <div
            v-else
            class="file-icon"
          >
            {{ getFileIcon(file.mimeType) }}
          </div>
        </div>

        <!-- 文件信息 -->
        <div class="file-info">
          <p class="file-name">
            {{ file.originalName }}
          </p>
          <p class="file-meta">{{ formatSize(file.size) }} · {{ formatDate(file.createdAt) }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="file-actions">
          <button
            class="action-btn"
            :title="t('admin.media.copyUrl')"
            @click.stop="copyUrl(file.url)"
          >
            📋
          </button>
          <button
            class="action-btn"
            :title="t('common.edit')"
            @click.stop="editFile(file)"
          >
            ✏️
          </button>
          <button
            class="action-btn delete"
            :title="t('common.delete')"
            @click.stop="deleteFile(file)"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div
      v-if="totalPages > 1"
      class="pagination"
    >
      <button
        :disabled="currentPage <= 1"
        class="page-btn"
        @click="
          currentPage--
          loadFiles()
        "
      >
        {{ t('common.prev') }}
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        :disabled="currentPage >= totalPages"
        class="page-btn"
        @click="
          currentPage++
          loadFiles()
        "
      >
        {{ t('common.next') }}
      </button>
    </div>

    <!-- 上传弹窗 -->
    <Teleport to="body">
      <div
        v-if="showUpload"
        class="modal-overlay"
        @click.self="showUpload = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('admin.media.uploadFile') }}</h3>
            <button
              class="close-btn"
              @click="showUpload = false"
            >
              ×
            </button>
          </div>
          <div class="modal-body">
            <div
              class="upload-area"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*,video/*,.pdf"
                multiple
                class="hidden"
                @change="handleFileSelect"
              />
              <div
                class="upload-placeholder"
                @click="fileInput?.click()"
              >
                <span class="upload-icon">📁</span>
                <p>{{ t('admin.media.dragOrClick') }}</p>
                <p class="upload-hint">
                  {{ t('admin.media.maxSize') }}
                </p>
              </div>
            </div>

            <!-- 上传进度 -->
            <div
              v-if="uploading"
              class="upload-progress"
            >
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: uploadProgress + '%' }"
                />
              </div>
              <span>{{ uploadProgress }}%</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div
        v-if="editingFile"
        class="modal-overlay"
        @click.self="editingFile = null"
      >
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('admin.media.editFile') }}</h3>
            <button
              class="close-btn"
              @click="editingFile = null"
            >
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="edit-preview">
              <img
                v-if="editingFile.mimeType.startsWith('image/')"
                :src="editingFile.url"
                :alt="editingFile.alt"
              />
            </div>
            <div class="edit-form">
              <div class="form-group">
                <label>{{ t('admin.media.altText') }}</label>
                <input
                  v-model="editForm.alt"
                  type="text"
                  :placeholder="t('admin.media.altPlaceholder')"
                />
              </div>
              <div class="form-group">
                <label>{{ t('admin.media.caption') }}</label>
                <textarea
                  v-model="editForm.caption"
                  :placeholder="t('admin.media.captionPlaceholder')"
                  rows="3"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="cancel-btn"
              @click="editingFile = null"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="save-btn"
              @click="saveEdit"
            >
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const { t } = useI18n()

interface MediaFile {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt: string | null
  caption: string | null
  folder: string
  createdAt: string
  uploader: {
    id: number
    username: string
  }
}

const files = ref<MediaFile[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const total = ref(0)
const filterType = ref('')
const searchQuery = ref('')
const selectedFiles = ref<number[]>([])
const showUpload = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const editingFile = ref<MediaFile | null>(null)
const editForm = reactive({
  alt: '',
  caption: '',
})
const stats = reactive({
  totalFiles: 0,
  totalSize: 0,
})

const fileInput = ref<HTMLInputElement | null>(null)

// 加载文件列表
const loadFiles = async () => {
  loading.value = true

  try {
    const data = await $fetch('/api/media', {
      params: {
        page: currentPage.value,
        pageSize: 20,
        mimeType: filterType.value || undefined,
        search: searchQuery.value || undefined,
      },
    })

    files.value = (data as any).data.files
    totalPages.value = (data as any).data.pagination.totalPages
    total.value = (data as any).data.pagination.total
    stats.totalFiles = (data as any).data.stats.totalFiles
    stats.totalSize = (data as any).data.stats.totalSize
  } catch (err) {
    console.error('Failed to load files:', err)
  } finally {
    loading.value = false
  }
}

// 选择/取消选择文件
const toggleSelect = (id: number) => {
  const index = selectedFiles.value.indexOf(id)
  if (index === -1) {
    selectedFiles.value.push(id)
  } else {
    selectedFiles.value.splice(index, 1)
  }
}

// 复制 URL
const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(window.location.origin + url)
    alert(t('admin.media.urlCopied'))
  } catch {
    // Fallback
    const input = document.createElement('input')
    input.value = window.location.origin + url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    alert(t('admin.media.urlCopied'))
  }
}

// 编辑文件
const editFile = (file: MediaFile) => {
  editingFile.value = file
  editForm.alt = file.alt || ''
  editForm.caption = file.caption || ''
}

// 保存编辑
const saveEdit = async () => {
  if (!editingFile.value) return

  try {
    await $fetch(`/api/media/${editingFile.value.id}`, {
      method: 'PUT',
      body: {
        alt: editForm.alt,
        caption: editForm.caption,
      },
    })

    editingFile.value = null
    loadFiles()
  } catch (err) {
    console.error('Failed to save:', err)
    alert(t('common.error'))
  }
}

// 删除文件
const deleteFile = async (file: MediaFile) => {
  if (!confirm(t('admin.media.confirmDelete', { name: file.originalName }))) {
    return
  }

  try {
    await $fetch(`/api/media/${file.id}`, {
      method: 'DELETE',
    })

    loadFiles()
  } catch (err) {
    console.error('Failed to delete:', err)
    alert(t('common.error'))
  }
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const selectedFiles = input.files

  if (!selectedFiles || selectedFiles.length === 0) return

  await uploadFiles(Array.from(selectedFiles))
}

// 处理拖放
const handleDrop = async (event: DragEvent) => {
  const droppedFiles = event.dataTransfer?.files

  if (!droppedFiles || droppedFiles.length === 0) return

  await uploadFiles(Array.from(droppedFiles))
}

// 上传文件
const uploadFiles = async (fileList: File[]) => {
  uploading.value = true
  uploadProgress.value = 0

  const totalFiles = fileList.length
  let uploaded = 0

  for (const file of fileList) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      await $fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      uploaded++
      uploadProgress.value = Math.round((uploaded / totalFiles) * 100)
    } catch (err) {
      console.error('Failed to upload:', file.name, err)
    }
  }

  uploading.value = false
  showUpload.value = false
  loadFiles()
}

// 获取文件图标
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.includes('pdf')) return '📄'
  return '📁'
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.media-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: 0;
}

.upload-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: var(--primary-hover);
}

/* 统计栏 */
.stats-bar {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* 筛选器 */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  min-width: 300px;
}

.search-input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.search-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 文件网格 */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.file-card {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.file-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-card.selected {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 59, 130, 246), 0.05);
}

.file-preview {
  width: 100%;
  height: 150px;
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 3rem;
}

.file-info {
  padding: 0.75rem;
}

.file-name {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-secondary);
}

.action-btn.delete:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
}

/* 模态框 */
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
}

.modal {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 59, 130, 246), 0.02);
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.upload-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s;
}

/* 编辑表单 */
.edit-preview {
  margin-bottom: 1rem;
  text-align: center;
}

.edit-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.save-btn {
  background: var(--primary-color);
  border: none;
  color: white;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .filters {
    flex-direction: column;
  }

  .search-box {
    min-width: auto;
  }
}
</style>
