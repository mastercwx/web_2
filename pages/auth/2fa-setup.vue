<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const router = useRouter()

const step = ref<'setup' | 'verify' | 'complete'>('setup')
const loading = ref(false)
const error = ref('')
const secret = ref('')
const qrCode = ref('')
const backupCodes = ref<string[]>([])
const setupToken = ref('')
const verificationCode = ref('')

// 获取 2FA 设置信息
async function initSetup() {
  loading.value = true
  error.value = ''

  try {
    const data = await $fetch('/api/auth/2fa/setup', {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
    })

    secret.value = data.data.secret
    qrCode.value = data.data.qrCode
    backupCodes.value = data.data.backupCodes
    setupToken.value = data.data.setupToken
    step.value = 'verify'
  } catch (err: any) {
    error.value = err.data?.message || '获取设置信息失败'
  } finally {
    loading.value = false
  }
}

// 验证并启用 2FA
async function verifyAndEnable() {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    error.value = '请输入 6 位验证码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: {
        token: verificationCode.value,
        setupToken: setupToken.value,
      },
    })

    step.value = 'complete'
  } catch (err: any) {
    error.value = err.data?.message || '验证失败'
  } finally {
    loading.value = false
  }
}

// 复制备份码
function copyBackupCodes() {
  const text = backupCodes.value.join('\n')
  navigator.clipboard.writeText(text)
}

// 下载备份码
function downloadBackupCodes() {
  const text = backupCodes.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hg-web-backup-codes.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// 完成设置
function finishSetup() {
  router.push('/users/me/settings')
}

onMounted(() => {
  initSetup()
})
</script>

<template>
  <div class="twofa-setup-page">
    <div class="setup-container">
      <h1 class="setup-title">
        {{ t('auth.2fa.setupTitle') }}
      </h1>

      <!-- 步骤 1：扫描二维码 -->
      <div
        v-if="step === 'setup'"
        class="setup-step"
      >
        <p class="step-description">
          {{ t('auth.2fa.setupDescription') }}
        </p>
        <div class="loading">
          {{ t('common.loading') }}
        </div>
      </div>

      <div
        v-else-if="step === 'verify'"
        class="setup-step"
      >
        <div class="step-content">
          <div class="qr-section">
            <h2 class="step-title">
              {{ t('auth.2fa.scanQRCode') }}
            </h2>
            <p class="step-description">
              {{ t('auth.2fa.scanDescription') }}
            </p>
            <div class="qr-code">
              <img
                :src="qrCode"
                :alt="t('auth.2fa.qrCodeAlt')"
              />
            </div>
            <div class="manual-entry">
              <p>{{ t('auth.2fa.manualEntry') }}:</p>
              <code class="secret-code">{{ secret }}</code>
            </div>
          </div>

          <div class="verify-section">
            <h2 class="step-title">
              {{ t('auth.2fa.enterCode') }}
            </h2>
            <p class="step-description">
              {{ t('auth.2fa.enterCodeDescription') }}
            </p>
            <div class="code-input-group">
              <input
                v-model="verificationCode"
                type="text"
                maxlength="6"
                pattern="[0-9]*"
                inputmode="numeric"
                class="code-input"
                :placeholder="t('auth.2fa.codePlaceholder')"
                @keyup.enter="verifyAndEnable"
              />
              <button
                class="verify-btn"
                :disabled="loading || verificationCode.length !== 6"
                @click="verifyAndEnable"
              >
                {{ loading ? t('common.loading') : t('auth.2fa.verify') }}
              </button>
            </div>
            <p
              v-if="error"
              class="error-message"
            >
              {{ error }}
            </p>
          </div>
        </div>

        <div class="backup-codes-section">
          <h2 class="step-title">
            {{ t('auth.2fa.backupCodes') }}
          </h2>
          <p class="step-description">
            {{ t('auth.2fa.backupCodesDescription') }}
          </p>
          <div class="backup-codes">
            <code
              v-for="code in backupCodes"
              :key="code"
              class="backup-code"
            >
              {{ code }}
            </code>
          </div>
          <div class="backup-actions">
            <button
              class="action-btn"
              @click="copyBackupCodes"
            >
              {{ t('auth.2fa.copyCodes') }}
            </button>
            <button
              class="action-btn"
              @click="downloadBackupCodes"
            >
              {{ t('auth.2fa.downloadCodes') }}
            </button>
          </div>
          <p class="warning-text">⚠️ {{ t('auth.2fa.backupCodesWarning') }}</p>
        </div>
      </div>

      <div
        v-else-if="step === 'complete'"
        class="setup-step"
      >
        <div class="success-icon">✅</div>
        <h2 class="step-title">
          {{ t('auth.2fa.setupComplete') }}
        </h2>
        <p class="step-description">
          {{ t('auth.2fa.setupCompleteDescription') }}
        </p>
        <button
          class="finish-btn"
          @click="finishSetup"
        >
          {{ t('auth.2fa.finish') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.twofa-setup-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  background: var(--bg-secondary);
}

.setup-container {
  max-width: 800px;
  width: 100%;
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
}

.setup-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
}

.setup-step {
  margin-top: 1.5rem;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.step-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.step-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.qr-code img {
  width: 200px;
  height: 200px;
}

.manual-entry {
  text-align: center;
  margin-top: 1rem;
}

.secret-code {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
}

.verify-section {
  display: flex;
  flex-direction: column;
}

.code-input-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.code-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1.5rem;
  font-family: monospace;
  text-align: center;
  letter-spacing: 0.5rem;
}

.code-input:focus {
  outline: none;
  border-color: var(--primary);
}

.verify-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
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

.backup-codes-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.backup-codes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.backup-code {
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
  text-align: center;
}

.backup-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--bg-tertiary);
}

.warning-text {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
}

.success-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
}

.finish-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 1.5rem;
}

.finish-btn:hover {
  opacity: 0.9;
}

.error-message {
  margin-top: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .step-content {
    grid-template-columns: 1fr;
  }

  .backup-codes {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
