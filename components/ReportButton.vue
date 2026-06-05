<script setup lang="ts">
const props = defineProps<{
  targetType: 'comment' | 'post' | 'user'
  targetId: number
}>()

const authStore = useAuthStore()

const isOpen = ref(false)
const loading = ref(false)
const success = ref(false)
const error = ref('')

const reasons = [
  { value: 'spam', label: '垃圾内容/广告' },
  { value: 'abuse', label: '辱骂/骚扰' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'copyright', label: '版权侵犯' },
  { value: 'other', label: '其他原因' },
]

const form = reactive({
  reason: '',
  description: '',
})

function toggleDropdown() {
  if (!authStore.isAuthenticated) {
    alert('请先登录')
    return
  }
  isOpen.value = !isOpen.value
  success.value = false
  error.value = ''
}

async function submitReport() {
  if (!form.reason) {
    error.value = '请选择举报原因'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/reports', {
      method: 'POST',
      body: {
        targetType: props.targetType,
        targetId: props.targetId,
        reason: form.reason,
        description: form.description,
      },
    })
    success.value = true
    form.reason = ''
    form.description = ''
  } catch (err: any) {
    error.value = err.message || '提交失败'
  } finally {
    loading.value = false
  }
}

function closeDropdown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.report-container')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="report-container">
    <button
      class="report-trigger"
      title="举报"
      @click.stop="toggleDropdown"
    >
      ⚑
    </button>

    <div
      v-if="isOpen"
      class="report-dropdown"
    >
      <div
        v-if="success"
        class="report-success"
      >
        <span class="success-icon">✓</span>
        <p>举报已提交，感谢您的反馈</p>
      </div>

      <template v-else>
        <h4 class="report-title">举报内容</h4>

        <div
          v-if="error"
          class="report-error"
        >
          {{ error }}
        </div>

        <div class="report-reasons">
          <label
            v-for="r in reasons"
            :key="r.value"
            class="reason-option"
          >
            <input
              v-model="form.reason"
              type="radio"
              :value="r.value"
            />
            <span>{{ r.label }}</span>
          </label>
        </div>

        <div class="report-description">
          <textarea
            v-model="form.description"
            placeholder="补充说明（可选）"
            rows="3"
          />
        </div>

        <div class="report-actions">
          <button
            class="btn-cancel"
            @click="isOpen = false"
          >
            取消
          </button>
          <button
            class="btn-submit"
            :disabled="loading || !form.reason"
            @click="submitReport"
          >
            {{ loading ? '提交中...' : '提交举报' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.report-container {
  position: relative;
  display: inline-block;
}

.report-trigger {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-tertiary);
  padding: 0.25rem;
  transition: color var(--transition-fast);
}

.report-trigger:hover {
  color: var(--color-danger);
}

.report-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 300px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 100;
  padding: 1rem;
}

.report-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.report-error {
  background: #fee;
  color: #c00;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.report-success {
  text-align: center;
  padding: 1rem;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.report-success p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.report-reasons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.reason-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.reason-option input[type='radio'] {
  margin: 0;
}

.report-description {
  margin-bottom: 1rem;
}

.report-description textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  resize: vertical;
}

.report-description textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background var(--transition-fast);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-submit {
  padding: 0.5rem 1rem;
  background: var(--color-danger);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background var(--transition-fast);
}

.btn-submit:hover:not(:disabled) {
  background: #c00;
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
