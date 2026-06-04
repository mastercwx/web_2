<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['guest'],
})

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.username || !form.password) {
    error.value = t('auth.errors.required')
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(form.username, form.password)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || t('auth.errors.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div>
        <h2 class="auth-title">
          {{ $t('auth.login.title') }}
        </h2>
        <p class="auth-subtitle">
          {{ $t('auth.login.subtitle') }}
          <NuxtLink
            to="/register"
            class="auth-link"
          >
            {{ $t('auth.login.registerLink') }}
          </NuxtLink>
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="handleLogin"
      >
        <div
          v-if="error"
          class="error-message"
        >
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div class="input-group">
          <div>
            <label
              for="username"
              class="sr-only"
              >{{ $t('auth.login.username') }}</label
            >
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="input-top"
              :placeholder="$t('auth.login.username')"
            />
          </div>
          <div>
            <label
              for="password"
              class="sr-only"
              >{{ $t('auth.login.password') }}</label
            >
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="input-bottom"
              :placeholder="$t('auth.login.password')"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full"
          >
            <span
              v-if="loading"
              class="loading-spinner"
            >
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            {{ loading ? $t('auth.login.submitting') : $t('auth.login.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.auth-card {
  max-width: 28rem;
  width: 100%;
}

.auth-title {
  text-align: center;
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--text-primary);
}

.auth-subtitle {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.auth-link {
  font-weight: 500;
  color: var(--color-primary);
}

.auth-link:hover {
  color: var(--color-primary-hover);
}

.auth-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.error-message {
  border-radius: var(--radius-md);
  background: #fef2f2;
  padding: 1rem;
  color: #991b1b;
}

:root.dark .error-message {
  background: #450a0a;
  color: #fca5a5;
}

.input-group {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.input-top,
.input-bottom {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.input-top {
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.input-bottom {
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  border-top: 0;
}

.input-top:focus,
.input-bottom:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  z-index: 10;
  position: relative;
}

.input-top::placeholder,
.input-bottom::placeholder {
  color: var(--text-tertiary);
}

.loading-spinner {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-left: 0.75rem;
  color: var(--color-primary-light);
}

.btn-primary {
  display: flex;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  color: var(--text-inverse);
  background: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.w-full {
  width: 100%;
}
</style>
