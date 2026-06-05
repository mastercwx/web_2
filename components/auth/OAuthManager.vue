<template>
  <div class="oauth-manager">
    <h2>{{ $t('settings.oauth.title') }}</h2>
    <p class="description">
      {{ $t('settings.oauth.description') }}
    </p>

    <div
      v-if="error"
      class="error-message"
    >
      {{ error }}
    </div>

    <div
      v-if="success"
      class="success-message"
    >
      {{ success }}
    </div>

    <div class="oauth-list">
      <!-- GitHub -->
      <div class="oauth-item">
        <div class="oauth-info">
          <svg
            class="icon github"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          <div>
            <h3>GitHub</h3>
            <p v-if="isLinked('github')">
              {{ $t('settings.oauth.linked') }}: {{ getProviderAccount('github')?.providerId }}
            </p>
            <p v-else>
              {{ $t('settings.oauth.notLinked') }}
            </p>
          </div>
        </div>
        <button
          v-if="isLinked('github')"
          class="btn-unlink"
          :disabled="loading"
          @click="unlinkProvider('github')"
        >
          {{ $t('settings.oauth.unlink') }}
        </button>
        <button
          v-else
          class="btn-link"
          :disabled="loading"
          @click="linkProvider('github')"
        >
          {{ $t('settings.oauth.link') }}
        </button>
      </div>

      <!-- Google -->
      <div class="oauth-item">
        <div class="oauth-info">
          <svg
            class="icon google"
            viewBox="0 0 24 24"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <div>
            <h3>Google</h3>
            <p v-if="isLinked('google')">
              {{ $t('settings.oauth.linked') }}: {{ getProviderAccount('google')?.providerId }}
            </p>
            <p v-else>
              {{ $t('settings.oauth.notLinked') }}
            </p>
          </div>
        </div>
        <button
          v-if="isLinked('google')"
          class="btn-unlink"
          :disabled="loading"
          @click="unlinkProvider('google')"
        >
          {{ $t('settings.oauth.unlink') }}
        </button>
        <button
          v-else
          class="btn-link"
          :disabled="loading"
          @click="linkProvider('google')"
        >
          {{ $t('settings.oauth.link') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const success = ref('')
const accounts = ref<Array<{ id: number; provider: string; providerId: string }>>([])

// 加载 OAuth 账号
async function loadAccounts() {
  try {
    const result = await $fetch<{ code: number; data: { accounts: any[] } }>(
      '/api/auth/oauth/accounts',
      {
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )

    if (result.code === 200) {
      accounts.value = result.data.accounts
    }
  } catch (err) {
    console.error('Failed to load OAuth accounts:', err)
  }
}

// 检查是否已绑定
function isLinked(provider: string): boolean {
  return accounts.value.some((account) => account.provider === provider)
}

// 获取提供商账号
function getProviderAccount(provider: string) {
  return accounts.value.find((account) => account.provider === provider)
}

// 绑定 OAuth 账号
async function linkProvider(provider: string) {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await $fetch<{ code: number; data: { authorizeUrl: string } }>(
      `/api/auth/oauth/${provider}`,
      {
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )

    if (result.code === 200 && result.data.authorizeUrl) {
      // 跳转到 OAuth 授权页面
      window.location.href = result.data.authorizeUrl
    }
  } catch (err: any) {
    error.value = err.data?.message || '绑定失败'
  } finally {
    loading.value = false
  }
}

// 解绑 OAuth 账号
async function unlinkProvider(provider: string) {
  if (!confirm(t('settings.oauth.unlinkConfirm'))) {
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await $fetch<{ code: number; message: string }>(
      `/api/auth/oauth/${provider}/unlink`,
      {
        method: 'POST',
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      },
    )

    if (result.code === 200) {
      success.value = result.message
      // 重新加载账号列表
      await loadAccounts()
    }
  } catch (err: any) {
    error.value = err.data?.message || '解绑失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAccounts()
})
</script>

<style scoped>
.oauth-manager {
  padding: 1rem 0;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.oauth-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.oauth-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.oauth-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.oauth-info .icon {
  width: 32px;
  height: 32px;
}

.oauth-info .icon.github {
  color: #333;
}

:root.dark .oauth-info .icon.github {
  color: #fff;
}

.oauth-info h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.oauth-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-link,
.btn-unlink {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-link {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-link:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-unlink {
  background: transparent;
  color: var(--text-secondary);
}

.btn-unlink:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
  border-color: #dc2626;
}

.btn-link:disabled,
.btn-unlink:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: #dc2626;
  margin-bottom: 1rem;
}

.success-message {
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  color: #16a34a;
  margin-bottom: 1rem;
}
</style>
