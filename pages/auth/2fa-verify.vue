<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const verificationCode = ref('')
const tempToken = ref('')

// 从 URL 参数获取临时令牌
onMounted(() => {
  tempToken.value = (route.query['tempToken'] as string) || ''

  if (!tempToken.value) {
    router.push('/auth/login')
  }
})

// 验证 2FA 代码
async function verify2FA() {
  if (!verificationCode.value) {
    error.value = t('auth.2fa.codeRequired')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await $fetch('/api/auth/2fa/login', {
      method: 'POST',
      body: {
        tempToken: tempToken.value,
        code: verificationCode.value,
      },
    })

    // 登录成功
    authStore.setAuth(data.data.user, data.data.token)
    router.push('/')
  } catch (err: any) {
    error.value = err.data?.message || t('auth.2fa.verificationFailed')
  } finally {
    loading.value = false
  }
}

// 返回登录页面
function backToLogin() {
  router.push('/auth/login')
}
</script>

<template>
  <div class="twofa-verify-page">
    <div class="verify-container">
      <div class="verify-icon">🔐</div>
      <h1 class="verify-title">
        {{ t('auth.2fa.verifyTitle') }}
      </h1>
      <p class="verify-description">
        {{ t('auth.2fa.verifyDescription') }}
      </p>

      <div class="verify-form">
        <div class="code-input-group">
          <input
            v-model="verificationCode"
            type="text"
            maxlength="7"
            class="code-input"
            :placeholder="t('auth.2fa.codeOrBackupPlaceholder')"
            @keyup.enter="verify2FA"
          />
        </div>

        <p
          v-if="error"
          class="error-message"
        >
          {{ error }}
        </p>

        <button
          class="verify-btn"
          :disabled="loading || !verificationCode"
          @click="verify2FA"
        >
          {{ loading ? t('common.loading') : t('auth.2fa.verify') }}
        </button>

        <button
          class="back-btn"
          @click="backToLogin"
        >
          {{ t('auth.2fa.backToLogin') }}
        </button>
      </div>

      <div class="help-text">
        <p>{{ t('auth.2fa.helpText') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.twofa-verify-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: var(--bg-secondary);
}

.verify-container {
  max-width: 400px;
  width: 100%;
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.verify-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.verify-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.verify-description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.verify-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.code-input-group {
  width: 100%;
}

.code-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1.25rem;
  font-family: monospace;
  text-align: center;
  letter-spacing: 0.25rem;
}

.code-input:focus {
  outline: none;
  border-color: var(--primary);
}

.verify-btn {
  width: 100%;
  padding: 0.875rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.verify-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.verify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-btn {
  width: 100%;
  padding: 0.875rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.help-text {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.help-text p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0;
}
</style>
