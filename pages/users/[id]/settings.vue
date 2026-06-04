<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const route = useRoute()

const userId = computed(() => Number(route.params['id']))

// 检查是否是自己的设置页
if (authStore.user?.id !== userId.value) {
  throw createError({
    statusCode: 403,
    message: '无权访问此页面',
  })
}

const activeTab = ref<'profile' | 'password' | 'avatar'>('profile')

// 个人资料表单
const profileForm = reactive({
  username: authStore.user?.username || '',
  email: authStore.user?.email || '',
})
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// 头像表单
const avatarForm = reactive({
  avatar: authStore.user?.avatar || '',
})
const currentAvatar = computed(() => authStore.user?.avatar || '')
const avatarLoading = ref(false)
const avatarError = ref('')
const avatarSuccess = ref('')

async function updateProfile() {
  profileLoading.value = true
  profileError.value = ''
  profileSuccess.value = ''

  try {
    const result = await $fetch<{ code: number; message: string; data: { user: any } }>(
      '/api/users/profile',
      {
        method: 'PUT',
        body: {
          username: profileForm.username,
          email: profileForm.email,
        },
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )

    if (result.code === 200) {
      profileSuccess.value = result.message
      // 更新本地存储的用户信息
      authStore.setAuth(result.data.user, authStore.token!)
    }
  } catch (err: any) {
    profileError.value = err.data?.message || '更新失败'
  } finally {
    profileLoading.value = false
  }
}

async function updatePassword() {
  passwordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    const result = await $fetch<{ code: number; message: string }>('/api/users/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      },
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
    })

    if (result.code === 200) {
      passwordSuccess.value = result.message
      // 清空表单
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  } catch (err: any) {
    passwordError.value = err.data?.message || '修改失败'
  } finally {
    passwordLoading.value = false
  }
}

async function updateAvatar() {
  avatarLoading.value = true
  avatarError.value = ''
  avatarSuccess.value = ''

  try {
    const result = await $fetch<{ code: number; message: string; data: { user: any } }>(
      '/api/users/avatar',
      {
        method: 'PUT',
        body: { avatar: avatarForm.avatar },
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )

    if (result.code === 200) {
      avatarSuccess.value = result.message
      // 更新本地存储的用户信息
      authStore.setAuth(result.data.user, authStore.token!)
    }
  } catch (err: any) {
    avatarError.value = err.data?.message || '更新失败'
  } finally {
    avatarLoading.value = false
  }
}

function handleTabChange(tab: 'profile' | 'password' | 'avatar') {
  activeTab.value = tab
  // 清除消息
  profileError.value = ''
  profileSuccess.value = ''
  passwordError.value = ''
  passwordSuccess.value = ''
  avatarError.value = ''
  avatarSuccess.value = ''
}
</script>

<template>
  <div class="settings-page">
    <h1 class="page-title">
      {{ t('settings.title') }}
    </h1>

    <div class="settings-container">
      <!-- 标签页 -->
      <div class="settings-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'profile' }"
          @click="handleTabChange('profile')"
        >
          {{ t('settings.profile.title') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'password' }"
          @click="handleTabChange('password')"
        >
          {{ t('settings.password.title') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'avatar' }"
          @click="handleTabChange('avatar')"
        >
          {{ t('settings.avatar.title') }}
        </button>
      </div>

      <!-- 个人资料 -->
      <div
        v-if="activeTab === 'profile'"
        class="settings-content card"
      >
        <h2>{{ t('settings.profile.title') }}</h2>

        <div
          v-if="profileError"
          class="error-message"
        >
          {{ profileError }}
        </div>
        <div
          v-if="profileSuccess"
          class="success-message"
        >
          {{ profileSuccess }}
        </div>

        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label for="username">{{ t('settings.profile.username') }}</label>
            <input
              id="username"
              v-model="profileForm.username"
              type="text"
              required
              minlength="2"
              maxlength="50"
              :placeholder="t('settings.profile.usernamePlaceholder')"
            />
          </div>

          <div class="form-group">
            <label for="email">{{ t('settings.profile.email') }}</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              :placeholder="t('settings.profile.emailPlaceholder')"
            />
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="profileLoading"
          >
            {{ profileLoading ? t('settings.profile.saving') : t('settings.profile.save') }}
          </button>
        </form>
      </div>

      <!-- 修改密码 -->
      <div
        v-if="activeTab === 'password'"
        class="settings-content card"
      >
        <h2>{{ t('settings.password.title') }}</h2>

        <div
          v-if="passwordError"
          class="error-message"
        >
          {{ passwordError }}
        </div>
        <div
          v-if="passwordSuccess"
          class="success-message"
        >
          {{ passwordSuccess }}
        </div>

        <form @submit.prevent="updatePassword">
          <div class="form-group">
            <label for="currentPassword">{{ t('settings.password.current') }}</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              required
              :placeholder="t('settings.password.currentPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label for="newPassword">{{ t('settings.password.new') }}</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="6"
              :placeholder="t('settings.password.newPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">{{ t('settings.password.confirm') }}</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              minlength="6"
              :placeholder="t('settings.password.confirmPlaceholder')"
            />
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="passwordLoading"
          >
            {{ passwordLoading ? t('settings.password.saving') : t('settings.password.save') }}
          </button>
        </form>
      </div>

      <!-- 头像设置 -->
      <div
        v-if="activeTab === 'avatar'"
        class="settings-content card"
      >
        <h2>{{ t('settings.avatar.title') }}</h2>

        <div
          v-if="avatarError"
          class="error-message"
        >
          {{ avatarError }}
        </div>
        <div
          v-if="avatarSuccess"
          class="success-message"
        >
          {{ avatarSuccess }}
        </div>

        <div class="avatar-preview">
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            :alt="authStore.user.username"
          />
          <div
            v-else
            class="avatar-placeholder"
          >
            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
          </div>
        </div>

        <form @submit.prevent="updateAvatar">
          <div class="form-group">
            <label for="avatar">{{ t('settings.avatar.url') }}</label>
            <input
              id="avatar"
              v-model="avatarForm.avatar"
              type="url"
              :placeholder="t('settings.avatar.urlPlaceholder')"
            />
            <small class="form-hint">{{ t('settings.avatar.hint') }}</small>
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="avatarLoading"
          >
            {{ avatarLoading ? t('settings.avatar.saving') : t('settings.avatar.save') }}
          </button>
        </form>

        <div class="upload-section">
          <p>{{ t('settings.avatar.or') }}</p>
          <AvatarUpload
            :current-avatar="currentAvatar"
            @uploaded="(url: string) => (avatarForm.avatar = url)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  margin-bottom: 2rem;
  font-size: 1.75rem;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.settings-content {
  padding: 2rem;
}

.settings-content h2 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
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

.error-message {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.success-message {
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  color: #16a34a;
  margin-bottom: 1.5rem;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.upload-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.upload-section p {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .settings-tabs {
    overflow-x: auto;
  }
}
</style>
