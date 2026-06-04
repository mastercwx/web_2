<template>
  <div class="forgot-password-page">
    <div class="auth-card">
      <h1>{{ t('auth.forgotPassword.title') }}</h1>
      <p class="description">
        {{ t('auth.forgotPassword.description') }}
      </p>

      <div
        v-if="success"
        class="success-message"
      >
        <p>{{ message }}</p>
        <div
          v-if="debugToken"
          class="debug-info"
        >
          <p class="debug-title">
            {{ t('auth.forgotPassword.debugTitle') }}
          </p>
          <code>{{ debugToken }}</code>
          <p class="debug-hint">
            {{ t('auth.forgotPassword.debugHint') }}
          </p>
        </div>
        <NuxtLink
          to="/reset-password"
          class="btn-primary"
        >
          {{ t('auth.forgotPassword.resetNow') }}
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
          <label for="email">{{ t('auth.forgotPassword.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="t('auth.forgotPassword.emailPlaceholder')"
            required
          />
        </div>

        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submit') }}
        </button>

        <div class="links">
          <NuxtLink to="/login">{{ t('auth.forgotPassword.backToLogin') }}</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const email = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)
const message = ref('')
const debugToken = ref('')

async function handleSubmit() {
  if (!email.value) {
    error.value = t('auth.errors.required')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })

    success.value = true
    message.value = data.message

    // 测试用，生产环境应删除
    if (data.debug) {
      debugToken.value = data.debug.resetToken
    }
  } catch (err: any) {
    error.value = err.data?.message || t('auth.forgotPassword.failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
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
  text-align: center;
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
  margin-bottom: 1rem;
}

.debug-info {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin: 1rem 0;
}

.debug-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.debug-info code {
  display: block;
  background: var(--bg-primary);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-family: monospace;
  word-break: break-all;
  margin: 0.5rem 0;
}

.debug-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
</style>
