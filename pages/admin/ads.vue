<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

interface Ad {
  id: number
  name: string
  description: string | null
  position: string
  type: string
  content: {
    imageUrl?: string
    linkUrl?: string
    html?: string
    text?: string
  }
  startDate: string
  endDate: string
  isActive: boolean
  priority: number
  impressions: number
  clicks: number
}

const ads = ref<Ad[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showStatsModal = ref(false)
const selectedAd = ref<Ad | null>(null)
const statsData = ref<Record<string, unknown> | null>(null)

// 广告位置选项
const positions = [
  { value: 'sidebar', label: '侧边栏' },
  { value: 'header', label: '页头' },
  { value: 'footer', label: '页脚' },
  { value: 'in-article', label: '文章内' },
]

// 广告类型选项
const types = [
  { value: 'BANNER', label: '横幅广告' },
  { value: 'SIDEBAR', label: '侧边栏广告' },
  { value: 'IN_ARTICLE', label: '文章内广告' },
  { value: 'NATIVE', label: '原生广告' },
  { value: 'POPUP', label: '弹窗广告' },
]

// 新广告表单
const newAd = ref({
  name: '',
  description: '',
  position: 'sidebar',
  type: 'BANNER',
  content: {
    imageUrl: '',
    linkUrl: '',
    html: '',
    text: '',
  },
  startDate: '',
  endDate: '',
  isActive: true,
  priority: 0,
})

// 获取广告列表
async function fetchAds() {
  loading.value = true
  try {
    const response = await $fetch<{ data: Ad[] }>('/api/ads')
    ads.value = response.data
  } catch (error) {
    console.error('获取广告列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 创建广告
async function handleCreate() {
  try {
    await $fetch('/api/ads', {
      method: 'POST',
      body: newAd.value,
    })
    showCreateModal.value = false
    resetForm()
    await fetchAds()
  } catch (error) {
    console.error('创建广告失败:', error)
    alert('创建失败，请检查输入')
  }
}

// 编辑广告
function handleEdit(ad: Ad) {
  selectedAd.value = {
    ...ad,
    startDate: ad.startDate?.split('T')[0] || '',
    endDate: ad.endDate?.split('T')[0] || '',
  }
  showEditModal.value = true
}

// 更新广告
async function handleUpdate() {
  if (!selectedAd.value) return

  try {
    await $fetch(`/api/ads/${selectedAd.value.id}`, {
      method: 'PUT',
      body: selectedAd.value,
    })
    showEditModal.value = false
    selectedAd.value = null
    await fetchAds()
  } catch (error) {
    console.error('更新广告失败:', error)
    alert('更新失败')
  }
}

// 删除广告
async function handleDelete(id: number) {
  if (!confirm('确定要删除这个广告吗？')) return

  try {
    await $fetch(`/api/ads/${id}`, {
      method: 'DELETE',
    })
    await fetchAds()
  } catch (error) {
    console.error('删除广告失败:', error)
    alert('删除失败')
  }
}

// 查看统计
async function handleStats(ad: Ad) {
  selectedAd.value = ad
  showStatsModal.value = true

  try {
    const response = await $fetch<{ data: Record<string, unknown> }>(`/api/ads/${ad.id}/stats`)
    statsData.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 切换广告状态
async function toggleAd(ad: Ad) {
  try {
    await $fetch(`/api/ads/${ad.id}`, {
      method: 'PUT',
      body: { isActive: !ad.isActive },
    })
    await fetchAds()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
}

// 重置表单
function resetForm() {
  newAd.value = {
    name: '',
    description: '',
    position: 'sidebar',
    type: 'BANNER',
    content: {
      imageUrl: '',
      linkUrl: '',
      html: '',
      text: '',
    },
    startDate: '',
    endDate: '',
    isActive: true,
    priority: 0,
  }
}

// 格式化数字
function formatNumber(num: number) {
  return num.toLocaleString()
}

// 计算 CTR
function calculateCTR(impressions: number, clicks: number) {
  if (impressions === 0) return '0%'
  return ((clicks / impressions) * 100).toFixed(2) + '%'
}

// 初始化
onMounted(() => {
  fetchAds()
})
</script>

<template>
  <div class="ads-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">广告管理</h1>
        <p class="page-description">管理网站广告位和投放</p>
      </div>
      <button
        class="btn btn-primary"
        @click="showCreateModal = true"
      >
        添加广告
      </button>
    </div>

    <!-- 广告列表 -->
    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else-if="ads.length === 0"
      class="empty-state"
    >
      <p>暂无广告</p>
    </div>

    <table
      v-else
      class="table"
    >
      <thead>
        <tr>
          <th>名称</th>
          <th>位置</th>
          <th>类型</th>
          <th>状态</th>
          <th>展示次数</th>
          <th>点击次数</th>
          <th>点击率</th>
          <th>优先级</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="ad in ads"
          :key="ad.id"
        >
          <td>{{ ad.name }}</td>
          <td>{{ positions.find((p) => p.value === ad.position)?.label || ad.position }}</td>
          <td>{{ types.find((t) => t.value === ad.type)?.label || ad.type }}</td>
          <td>
            <span :class="['status-badge', ad.isActive ? 'active' : 'inactive']">
              {{ ad.isActive ? '启用' : '禁用' }}
            </span>
          </td>
          <td>{{ formatNumber(ad.impressions) }}</td>
          <td>{{ formatNumber(ad.clicks) }}</td>
          <td>{{ calculateCTR(ad.impressions, ad.clicks) }}</td>
          <td>{{ ad.priority }}</td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-icon"
                title="统计"
                @click="handleStats(ad)"
              >
                📊
              </button>
              <button
                class="btn-icon"
                title="编辑"
                @click="handleEdit(ad)"
              >
                ✏️
              </button>
              <button
                class="btn-icon"
                title="删除"
                @click="handleDelete(ad.id)"
              >
                🗑️
              </button>
              <button
                class="btn-icon"
                :title="ad.isActive ? '禁用' : '启用'"
                @click="toggleAd(ad)"
              >
                {{ ad.isActive ? '🔴' : '🟢' }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 创建广告模态框 -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="modal-overlay"
        @click.self="showCreateModal = false"
      >
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2>添加广告</h2>
            <button
              class="btn-close"
              @click="showCreateModal = false"
            >
              ×
            </button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">名称</label>
                <input
                  v-model="newAd.name"
                  type="text"
                  class="form-input"
                  placeholder="广告名称"
                />
              </div>

              <div class="form-group">
                <label class="form-label">位置</label>
                <select
                  v-model="newAd.position"
                  class="form-input"
                >
                  <option
                    v-for="pos in positions"
                    :key="pos.value"
                    :value="pos.value"
                  >
                    {{ pos.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">类型</label>
                <select
                  v-model="newAd.type"
                  class="form-input"
                >
                  <option
                    v-for="type in types"
                    :key="type.value"
                    :value="type.value"
                  >
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">优先级</label>
                <input
                  v-model.number="newAd.priority"
                  type="number"
                  class="form-input"
                  min="0"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="newAd.description"
                class="form-input"
                rows="2"
                placeholder="广告描述（可选）"
              />
            </div>

            <div class="form-group">
              <label class="form-label">广告内容</label>
              <div class="content-fields">
                <div class="form-group">
                  <label class="form-label-sm">图片 URL</label>
                  <input
                    v-model="newAd.content.imageUrl"
                    type="url"
                    class="form-input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-sm">链接 URL</label>
                  <input
                    v-model="newAd.content.linkUrl"
                    type="url"
                    class="form-input"
                    placeholder="https://example.com"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-sm">文字内容</label>
                  <input
                    v-model="newAd.content.text"
                    type="text"
                    class="form-input"
                    placeholder="广告文字"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-sm">HTML 代码</label>
                  <textarea
                    v-model="newAd.content.html"
                    class="form-input"
                    rows="3"
                    placeholder="自定义 HTML（高级）"
                  />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">开始日期</label>
                <input
                  v-model="newAd.startDate"
                  type="date"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">结束日期</label>
                <input
                  v-model="newAd.endDate"
                  type="date"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="newAd.isActive"
                  type="checkbox"
                />
                <span>启用广告</span>
              </label>
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

    <!-- 编辑广告模态框 -->
    <Teleport to="body">
      <div
        v-if="showEditModal && selectedAd"
        class="modal-overlay"
        @click.self="showEditModal = false"
      >
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2>编辑广告</h2>
            <button
              class="btn-close"
              @click="showEditModal = false"
            >
              ×
            </button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">名称</label>
                <input
                  v-model="selectedAd.name"
                  type="text"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">位置</label>
                <select
                  v-model="selectedAd.position"
                  class="form-input"
                >
                  <option
                    v-for="pos in positions"
                    :key="pos.value"
                    :value="pos.value"
                  >
                    {{ pos.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">类型</label>
                <select
                  v-model="selectedAd.type"
                  class="form-input"
                >
                  <option
                    v-for="type in types"
                    :key="type.value"
                    :value="type.value"
                  >
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">优先级</label>
                <input
                  v-model.number="selectedAd.priority"
                  type="number"
                  class="form-input"
                  min="0"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="selectedAd.description"
                class="form-input"
                rows="2"
              />
            </div>

            <div class="form-group">
              <label class="form-label">广告内容</label>
              <div class="content-fields">
                <div class="form-group">
                  <label class="form-label-sm">图片 URL</label>
                  <input
                    v-model="selectedAd.content.imageUrl"
                    type="url"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-sm">链接 URL</label>
                  <input
                    v-model="selectedAd.content.linkUrl"
                    type="url"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-sm">文字内容</label>
                  <input
                    v-model="selectedAd.content.text"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label-sm">HTML 代码</label>
                  <textarea
                    v-model="selectedAd.content.html"
                    class="form-input"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">开始日期</label>
                <input
                  v-model="selectedAd.startDate"
                  type="date"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">结束日期</label>
                <input
                  v-model="selectedAd.endDate"
                  type="date"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="selectedAd.isActive"
                  type="checkbox"
                />
                <span>启用广告</span>
              </label>
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

    <!-- 统计模态框 -->
    <Teleport to="body">
      <div
        v-if="showStatsModal && selectedAd"
        class="modal-overlay"
        @click.self="showStatsModal = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>广告统计 - {{ selectedAd.name }}</h2>
            <button
              class="btn-close"
              @click="showStatsModal = false"
            >
              ×
            </button>
          </div>

          <div class="modal-body">
            <div
              v-if="statsData"
              class="stats-content"
            >
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">
                    {{ formatNumber((statsData['impressions'] as number) || 0) }}
                  </div>
                  <div class="stat-label">展示次数</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">
                    {{ formatNumber((statsData['clicks'] as number) || 0) }}
                  </div>
                  <div class="stat-label">点击次数</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">
                    {{ statsData['ctr'] || '0%' }}
                  </div>
                  <div class="stat-label">点击率 (CTR)</div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="loading"
            >
              加载中...
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="showStatsModal = false"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ads-page {
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

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
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

.action-buttons {
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

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
}

.modal-lg {
  max-width: 700px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.content-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.form-label-sm {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  display: block;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
</style>
