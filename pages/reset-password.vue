<template>
  <div class="reset-password-page">
    <div class="auth-card">
      <h1>{{ t('auth.resetPassword.title') }}</h1>
      <p class="description">
        {{ t('auth.resetPassword.description') }}
      </p>

      <div
        v-if="success"
        class="success-message"
      >
        <p>{{ message }}</p>
        <NuxtLink
          to="/login"
          class="btn-primary"
        >
          {{ t('auth.resetPassword.goToLogin') }}
        </NuxtLink>
      </div>

      <form
        v-else
        @submit.prevent="handleSubmit"
      >
        <div
          v-if="error"
          class="error-message"
        >
          {{ error }}
        </div>

        <div class="form-group">
          <label for="token">{{ t('auth.resetPassword.token') }}</label>
          <input
            id="token"
            v-model="token"
            type="text"
            :placeholder="t('auth.resetPassword.tokenPlaceholder')"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">{{ t('auth.resetPassword.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="t('auth.resetPassword.passwordPlaceholder')"
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">{{ t('auth.resetPassword.confirmPassword') }}</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            :placeholder="t('auth.resetPassword.confirmPasswordPlaceholder')"
            required
          />
        </div>

        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.submit') }}
        </button>

        <div class="links">
          <NuxtLink to="/login">{{ t('auth.resetPassword.backToLogin') }}</NuxtLink>
          <NuxtLink to="/forgot-password">{{ t('auth.resetPassword.requestNew') }}</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const token = ref((route.query['token'] as string) || '')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)
const message = ref('')

async function handleSubmit() {
  if (!token.value || !password.value || !confirmPassword.value) {
    error.value = t('auth.errors.required')
    return
  }

  if (password.value.length < 6) {
    error.value = t('auth.errors.passwordLength')
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = t('auth.errors.passwordMismatch')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      },
    })

    success.value = true
    message.value = data.message

    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err: any) {
    error.value = err.data?.message || t('auth.resetPassword.failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

h1 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  text-align: center;
}

.description {
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
  display: inline-block;
  text-decoration: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.links {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.links a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.links a:hover {
  text-decoration: underline;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.success-message {
  text-align: center;
  color: var(--text-primary);
}

.success-message p {
  margin-bottom: 1.5rem;
}
</style>
