<template>
  <div class="verify-page">
    <div class="verify-card">
      <!-- 加载中 -->
      <div
        v-if="loading"
        class="verify-content"
      >
        <div class="loading-spinner" />
        <h2>{{ t('auth.verify.verifying') }}</h2>
        <p>{{ t('auth.verify.pleaseWait') }}</p>
      </div>

      <!-- 验证成功 -->
      <div
        v-else-if="verified"
        class="verify-content success"
      >
        <div class="success-icon">✅</div>
        <h2>{{ t('auth.verify.success') }}</h2>
        <p>{{ t('auth.verify.successMessage') }}</p>
        <NuxtLink
          to="/login"
          class="verify-btn"
        >
          {{ t('auth.verify.goToLogin') }}
        </NuxtLink>
      </div>

      <!-- 验证失败 -->
      <div
        v-else-if="error"
        class="verify-content error"
      >
        <div class="error-icon">❌</div>
        <h2>{{ t('auth.verify.failed') }}</h2>
        <p>{{ error }}</p>
        <div class="actions">
          <button
            v-if="!emailVerified"
            class="verify-btn"
            :disabled="resending"
            @click="resendVerification"
          >
            {{ resending ? t('auth.verify.resending') : t('auth.verify.resend') }}
          </button>
          <NuxtLink
            to="/"
            class="verify-btn secondary"
          >
            {{ t('auth.verify.goHome') }}
          </NuxtLink>
        </div>
      </div>

      <!-- 未登录提示 -->
      <div
        v-else-if="!isAuthenticated"
        class="verify-content"
      >
        <div class="info-icon">📧</div>
        <h2>{{ t('auth.verify.checkEmail') }}</h2>
        <p>{{ t('auth.verify.checkEmailMessage') }}</p>
        <NuxtLink
          to="/login"
          class="verify-btn"
        >
          {{ t('auth.verify.goToLogin') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const verified = ref(false)
const error = ref('')
const resending = ref(false)
const emailVerified = ref(false)

const isAuthenticated = computed(() => !!authStore.token)

// 验证邮箱
const verifyEmail = async (token: string) => {
  try {
    await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { token },
    })
    verified.value = true
  } catch (err: any) {
    error.value = err.data?.message || t('auth.verify.errorMessage')
  } finally {
    loading.value = false
  }
}

// 重新发送验证邮件
const resendVerification = async () => {
  resending.value = true

  try {
    await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    alert(t('auth.verify.emailSent'))
  } catch (err: any) {
    if (err.data?.message === '邮箱已验证') {
      emailVerified.value = true
    }
    error.value = err.data?.message || t('auth.verify.sendFailed')
  } finally {
    resending.value = false
  }
}

onMounted(() => {
  const token = route.query['token'] as string

  if (token) {
    verifyEmail(token)
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-secondary);
}

.verify-card {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.verify-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-icon,
.error-icon,
.info-icon {
  font-size: 4rem;
}

.verify-content h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.verify-content p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.success h2 {
  color: #10b981;
}

.error h2 {
  color: #ef4444;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
}

.verify-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.verify-btn:hover {
  background: var(--primary-hover);
}

.verify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.verify-btn.secondary:hover {
  background: var(--border-color);
}
</style>
