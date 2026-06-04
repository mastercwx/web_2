<script setup lang="ts">
/**
 * 系统设置页面
 */
definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

interface Setting {
  id: number
  key: string
  value: string
  group: string
  label: string | null
}

const loading = ref(false)
const saving = ref(false)
const initializing = ref(false)
const settings = ref<Setting[]>([])
const editedValues = ref<Record<string, string>>({})
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// 分组标签
const groupLabels: Record<string, string> = {
  site: '站点信息',
  social: '社交媒体',
  comment: '评论设置',
  email: '邮件设置',
  maintenance: '维护模式',
}

// 分组图标
const groupIcons: Record<string, string> = {
  site: '🌐',
  social: '🔗',
  comment: '💬',
  email: '📧',
  maintenance: '🔧',
}

// 加载设置
async function loadSettings() {
  loading.value = true
  try {
    const data = await $fetch<{ settings: Setting[] }>('/api/admin/settings')
    settings.value = data.settings

    // 初始化编辑值
    for (const setting of data.settings) {
      editedValues.value[setting.key] = setting.value
    }
  } catch (error: any) {
    message.value = error.data?.message || '加载设置失败'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// 保存设置
async function saveSettings() {
  saving.value = true
  message.value = ''

  try {
    const settingsToUpdate = Object.entries(editedValues.value).map(([key, value]) => ({
      key,
      value,
    }))

    const result = await $fetch<{ message: string }>('/api/admin/settings', {
      method: 'PUT',
      body: { settings: settingsToUpdate },
    })

    message.value = result.message
    messageType.value = 'success'
  } catch (error: any) {
    message.value = error.data?.message || '保存设置失败'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

// 初始化默认设置
async function initSettings() {
  initializing.value = true
  message.value = ''

  try {
    const result = await $fetch<{ message: string }>('/api/admin/settings/init', {
      method: 'POST',
    })

    message.value = result.message
    messageType.value = 'success'
    await loadSettings()
  } catch (error: any) {
    message.value = error.data?.message || '初始化设置失败'
    messageType.value = 'error'
  } finally {
    initializing.value = false
  }
}

// 按分组获取设置
function getSettingsByGroup(group: string): Setting[] {
  return settings.value.filter((s) => s.group === group)
}

// 获取所有分组
function getGroups(): string[] {
  const groups = new Set(settings.value.map((s) => s.group))
  return Array.from(groups).sort()
}

// 判断是否为布尔值
function isBooleanSetting(key: string): boolean {
  return key.includes('.enabled') || key.includes('.moderation')
}

// 判断是否为密码字段
function isPasswordSetting(key: string): boolean {
  return key.includes('pass') || key.includes('secret') || key.includes('token')
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>⚙️ 系统设置</h1>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          :disabled="initializing"
          @click="initSettings"
        >
          {{ initializing ? '初始化中...' : '🔄 初始化默认设置' }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="saving"
          @click="saveSettings"
        >
          {{ saving ? '保存中...' : '💾 保存设置' }}
        </button>
      </div>
    </div>

    <!-- 提示消息 -->
    <div
      v-if="message"
      :class="['message', messageType]"
    >
      {{ message }}
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading"
    >
      <div class="spinner" />
      <p>加载设置中...</p>
    </div>

    <!-- 设置表单 -->
    <div
      v-else
      class="settings-content"
    >
      <div
        v-for="group in getGroups()"
        :key="group"
        class="settings-group"
      >
        <div class="group-header">
          <span class="group-icon">{{ groupIcons[group] || '📋' }}</span>
          <h2>{{ groupLabels[group] || group }}</h2>
        </div>

        <div class="settings-list">
          <div
            v-for="setting in getSettingsByGroup(group)"
            :key="setting.key"
            class="setting-item"
          >
            <label
              :for="setting.key"
              class="setting-label"
            >
              {{ setting.label || setting.key }}
              <span class="setting-key">{{ setting.key }}</span>
            </label>

            <div class="setting-input">
              <!-- 布尔值使用开关 -->
              <label
                v-if="isBooleanSetting(setting.key)"
                class="toggle-switch"
              >
                <input
                  :id="setting.key"
                  v-model="editedValues[setting.key]"
                  type="checkbox"
                  true-value="true"
                  false-value="false"
                />
                <span class="toggle-slider" />
              </label>

              <!-- 密码字段 -->
              <input
                v-else-if="isPasswordSetting(setting.key)"
                :id="setting.key"
                v-model="editedValues[setting.key]"
                type="password"
                class="input"
                :placeholder="setting.label || setting.key"
              />

              <!-- 普通文本 -->
              <input
                v-else
                :id="setting.key"
                v-model="editedValues[setting.key]"
                type="text"
                class="input"
                :placeholder="setting.label || setting.key"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-group {
  background: var(--color-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.group-icon {
  font-size: 1.5rem;
}

.group-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.setting-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-key {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-family: monospace;
}

.setting-input {
  flex: 1;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .setting-input {
    width: 100%;
  }
}
</style>
