<template>
  <div class="experiments-page">
    <div class="page-header">
      <h1>{{ $t('admin.experiments.title') }}</h1>
      <button
        class="btn-primary"
        @click="showCreateModal = true"
      >
        {{ $t('admin.experiments.create') }}
      </button>
    </div>

    <!-- 实验列表 -->
    <div class="experiments-list">
      <div
        v-if="loading"
        class="loading"
      >
        {{ $t('common.loading') }}
      </div>

      <div
        v-else-if="experiments.length === 0"
        class="empty"
      >
        {{ $t('admin.experiments.noExperiments') }}
      </div>

      <div
        v-else
        class="experiments-grid"
      >
        <div
          v-for="exp in experiments"
          :key="exp.id"
          class="experiment-card"
        >
          <div class="experiment-header">
            <h3>{{ exp.name }}</h3>
            <span
              class="status-badge"
              :class="exp.status.toLowerCase()"
            >
              {{ exp.status }}
            </span>
          </div>

          <p
            v-if="exp.description"
            class="description"
          >
            {{ exp.description }}
          </p>

          <div class="experiment-meta">
            <span>{{ $t('admin.experiments.variants') }}: {{ exp.variants.length }}</span>
            <span>{{ $t('admin.experiments.users') }}: {{ exp._count.assignments }}</span>
          </div>

          <div class="experiment-variants">
            <div
              v-for="variant in exp.variants"
              :key="variant.id"
              class="variant-tag"
              :class="{ control: variant.isControl }"
            >
              {{ variant.name }}
              <span class="weight">({{ variant.weight }}%)</span>
            </div>
          </div>

          <div class="experiment-actions">
            <button
              v-if="exp.status === 'DRAFT'"
              class="btn-start"
              @click="updateStatus(exp.id, 'RUNNING')"
            >
              {{ $t('admin.experiments.start') }}
            </button>
            <button
              v-if="exp.status === 'RUNNING'"
              class="btn-pause"
              @click="updateStatus(exp.id, 'PAUSED')"
            >
              {{ $t('admin.experiments.pause') }}
            </button>
            <button
              v-if="exp.status === 'PAUSED'"
              class="btn-resume"
              @click="updateStatus(exp.id, 'RUNNING')"
            >
              {{ $t('admin.experiments.resume') }}
            </button>
            <button
              v-if="exp.status !== 'COMPLETED'"
              class="btn-complete"
              @click="updateStatus(exp.id, 'COMPLETED')"
            >
              {{ $t('admin.experiments.complete') }}
            </button>
            <button
              class="btn-stats"
              @click="viewStats(exp.id)"
            >
              {{ $t('admin.experiments.stats') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建实验模态框 -->
    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="showCreateModal = false"
    >
      <div class="modal">
        <h2>{{ $t('admin.experiments.createTitle') }}</h2>

        <form @submit.prevent="createExperiment">
          <div class="form-group">
            <label for="name">{{ $t('admin.experiments.name') }}</label>
            <input
              id="name"
              v-model="newExperiment.name"
              type="text"
              required
              :placeholder="$t('admin.experiments.namePlaceholder')"
            />
          </div>

          <div class="form-group">
            <label for="description">{{ $t('admin.experiments.description') }}</label>
            <textarea
              id="description"
              v-model="newExperiment.description"
              :placeholder="$t('admin.experiments.descriptionPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label>{{ $t('admin.experiments.variants') }}</label>
            <div
              v-for="(variant, index) in newExperiment.variants"
              :key="index"
              class="variant-input"
            >
              <input
                v-model="variant.name"
                type="text"
                :placeholder="$t('admin.experiments.variantName')"
                required
              />
              <input
                v-model.number="variant.weight"
                type="number"
                min="1"
                max="100"
                :placeholder="$t('admin.experiments.weight')"
                required
              />
              <label class="checkbox-label">
                <input
                  v-model="variant.isControl"
                  type="checkbox"
                />
                {{ $t('admin.experiments.control') }}
              </label>
              <button
                type="button"
                class="btn-remove"
                @click="removeVariant(index)"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              class="btn-add-variant"
              @click="addVariant"
            >
              + {{ $t('admin.experiments.addVariant') }}
            </button>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-cancel"
              @click="showCreateModal = false"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="creating"
            >
              {{ creating ? $t('common.creating') : $t('common.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 统计模态框 -->
    <div
      v-if="showStatsModal"
      class="modal-overlay"
      @click.self="showStatsModal = false"
    >
      <div class="modal modal-large">
        <h2>{{ $t('admin.experiments.statsTitle') }}</h2>

        <div
          v-if="statsLoading"
          class="loading"
        >
          {{ $t('common.loading') }}
        </div>

        <div
          v-else-if="stats"
          class="stats-content"
        >
          <div class="stats-header">
            <h3>{{ stats.experiment.name }}</h3>
            <span
              class="status-badge"
              :class="stats.experiment.status.toLowerCase()"
            >
              {{ stats.experiment.status }}
            </span>
          </div>

          <div class="stats-grid">
            <div
              v-for="variant in stats.variants"
              :key="variant.variantId"
              class="variant-stats"
            >
              <h4>
                {{ variant.variantName }}
                <span
                  v-if="variant.isControl"
                  class="control-badge"
                >
                  {{ $t('admin.experiments.controlGroup') }}
                </span>
              </h4>
              <div class="stat-item">
                <span class="label">{{ $t('admin.experiments.totalUsers') }}</span>
                <span class="value">{{ variant.totalUsers }}</span>
              </div>
              <div
                v-for="event in variant.events"
                :key="event.name"
                class="stat-item"
              >
                <span class="label">{{ event.name }}</span>
                <span class="value">{{ event.count }}</span>
                <span
                  v-if="event.totalValue"
                  class="sub-value"
                >
                  ({{ event.totalValue.toFixed(2) }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            class="btn-cancel"
            @click="showStatsModal = false"
          >
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const authStore = useAuthStore()

const loading = ref(true)
const experiments = ref<any[]>([])
const showCreateModal = ref(false)
const showStatsModal = ref(false)
const creating = ref(false)
const statsLoading = ref(false)
const stats = ref<any>(null)

const newExperiment = reactive({
  name: '',
  description: '',
  variants: [
    { name: 'control', weight: 50, isControl: true },
    { name: 'treatment', weight: 50, isControl: false },
  ],
})

// 加载实验列表
async function loadExperiments() {
  loading.value = true
  try {
    const { data } = await useFetch<{
      code: number
      data: { experiments: any[] }
    }>('/api/experiments', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (data.value?.code === 200) {
      experiments.value = data.value.data.experiments
    }
  } catch (err) {
    console.error('Failed to load experiments:', err)
  } finally {
    loading.value = false
  }
}

// 创建实验
async function createExperiment() {
  creating.value = true
  try {
    const { data } = await useFetch<{
      code: number
      message: string
    }>('/api/experiments', {
      method: 'POST',
      body: {
        name: newExperiment.name,
        description: newExperiment.description,
        variants: newExperiment.variants,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (data.value?.code === 200) {
      showCreateModal.value = false
      // 重置表单
      newExperiment.name = ''
      newExperiment.description = ''
      newExperiment.variants = [
        { name: 'control', weight: 50, isControl: true },
        { name: 'treatment', weight: 50, isControl: false },
      ]
      // 重新加载列表
      await loadExperiments()
    }
  } catch (err) {
    console.error('Failed to create experiment:', err)
  } finally {
    creating.value = false
  }
}

// 更新实验状态
async function updateStatus(id: number, status: string) {
  try {
    const { data } = await useFetch<{
      code: number
      message: string
    }>(`/api/experiments/${id}/status`, {
      method: 'PUT',
      body: { status },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (data.value?.code === 200) {
      await loadExperiments()
    }
  } catch (err) {
    console.error('Failed to update experiment status:', err)
  }
}

// 查看统计
async function viewStats(id: number) {
  showStatsModal.value = true
  statsLoading.value = true
  stats.value = null

  try {
    const { data } = await useFetch<{
      code: number
      data: { stats: any }
    }>(`/api/experiments/${id}/stats`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (data.value?.code === 200) {
      stats.value = data.value.data.stats
    }
  } catch (err) {
    console.error('Failed to load experiment stats:', err)
  } finally {
    statsLoading.value = false
  }
}

// 添加变体
function addVariant() {
  newExperiment.variants.push({
    name: '',
    weight: 10,
    isControl: false,
  })
}

// 移除变体
function removeVariant(index: number) {
  if (newExperiment.variants.length > 2) {
    newExperiment.variants.splice(index, 1)
  }
}

onMounted(() => {
  loadExperiments()
})
</script>

<style scoped>
.experiments-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.experiments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.experiment-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.experiment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.experiment-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.draft {
  background: #e5e7eb;
  color: #374151;
}

.status-badge.running {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.paused {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #dbeafe;
  color: #1e40af;
}

.description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.experiment-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.experiment-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.variant-tag {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.variant-tag.control {
  background: var(--color-primary);
  color: white;
}

.variant-tag .weight {
  opacity: 0.7;
  font-size: 0.75rem;
}

.experiment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.experiment-actions button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-start,
.btn-resume {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-start:hover,
.btn-resume:hover {
  background: #059669;
}

.btn-pause {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-pause:hover {
  background: #d97706;
}

.btn-complete {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.btn-complete:hover {
  background: #4f46e5;
}

.btn-stats {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-stats:hover {
  background: var(--bg-tertiary);
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
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal h2 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.variant-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.variant-input input[type='text'] {
  flex: 2;
}

.variant-input input[type='number'] {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-remove {
  padding: 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
}

.btn-remove:hover {
  background: #dc2626;
}

.btn-add-variant {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-add-variant:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

/* 统计 */
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.stats-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.variant-stats {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 1.5rem;
}

.variant-stats h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-badge {
  padding: 0.125rem 0.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-item .value {
  font-weight: 600;
  color: var(--text-primary);
}

.stat-item .sub-value {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .experiments-grid {
    grid-template-columns: 1fr;
  }

  .variant-input {
    flex-wrap: wrap;
  }

  .variant-input input[type='text'],
  .variant-input input[type='number'] {
    flex: 1 1 100%;
  }
}
</style>
