<template>
  <div
    v-if="showInstallPrompt"
    class="pwa-install-prompt"
  >
    <div class="install-content">
      <div class="install-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line
            x1="12"
            y1="15"
            x2="12"
            y2="3"
          />
        </svg>
      </div>
      <div class="install-text">
        <h3>{{ $t('pwa.installTitle') }}</h3>
        <p>{{ $t('pwa.installDescription') }}</p>
      </div>
      <div class="install-actions">
        <button
          class="btn-install"
          @click="install"
        >
          {{ $t('pwa.install') }}
        </button>
        <button
          class="btn-dismiss"
          @click="dismiss"
        >
          {{ $t('pwa.dismiss') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()

const showInstallPrompt = ref(false)

// 监听 PWA 安装提示事件
onMounted(() => {
  if ($pwa?.showInstallPrompt) {
    showInstallPrompt.value = true
  }
})

// 安装 PWA
async function install() {
  if ($pwa?.install) {
    await $pwa.install()
    showInstallPrompt.value = false
  }
}

// 关闭提示
function dismiss() {
  showInstallPrompt.value = false
  // 保存用户选择，避免再次显示
  if (import.meta.client) {
    localStorage.setItem('pwa-install-dismissed', 'true')
  }
}
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 400px;
  width: calc(100% - 40px);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.install-content {
  padding: 20px;
}

.install-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  background: var(--color-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.install-icon svg {
  width: 24px;
  height: 24px;
}

.install-text {
  text-align: center;
  margin-bottom: 20px;
}

.install-text h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.install-text p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.install-actions {
  display: flex;
  gap: 12px;
}

.btn-install,
.btn-dismiss {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-install {
  background: var(--color-primary);
  color: white;
}

.btn-install:hover {
  background: var(--color-primary-hover);
}

.btn-dismiss {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-dismiss:hover {
  background: var(--bg-tertiary);
}
</style>
