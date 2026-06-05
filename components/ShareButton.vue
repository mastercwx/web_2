<script setup lang="ts">
const props = defineProps<{
  title: string
  url?: string
  description?: string
}>()

const { t } = useI18n()

const isOpen = ref(false)
const copied = ref(false)

// 获取当前页面 URL
const shareUrl = computed(() => {
  if (props.url) return props.url
  if (import.meta.client) return window.location.href
  return ''
})

// 分享到各平台
function shareToTwitter() {
  const text = encodeURIComponent(props.title)
  const url = encodeURIComponent(shareUrl.value)
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    '_blank',
    'noopener,noreferrer',
  )
}

function shareToFacebook() {
  const url = encodeURIComponent(shareUrl.value)
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    '_blank',
    'noopener,noreferrer',
  )
}

function shareToLinkedIn() {
  const url = encodeURIComponent(shareUrl.value)
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    '_blank',
    'noopener,noreferrer',
  )
}

function shareToWeibo() {
  const text = encodeURIComponent(props.title)
  const url = encodeURIComponent(shareUrl.value)
  window.open(
    `https://service.weibo.com/share/share.php?title=${text}&url=${url}`,
    '_blank',
    'noopener,noreferrer',
  )
}

// 复制链接
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // fallback
    const input = document.createElement('input')
    input.value = shareUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// 点击外部关闭
function closeDropdown() {
  isOpen.value = false
}

// 使用 Web Share API（移动端）
async function nativeShare() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.title,
        url: shareUrl.value,
        text: props.description || '',
      })
    } catch {
      // 用户取消
    }
  } else {
    isOpen.value = !isOpen.value
  }
}

// 检查是否支持 Web Share API
const canNativeShare = computed(() => {
  return import.meta.client && !!navigator.share
})
</script>

<template>
  <div class="share-container">
    <button
      class="share-btn"
      :title="t('share.title')"
      @click="nativeShare"
    >
      <span class="share-icon">📤</span>
      <span class="share-text">{{ t('share.title') }}</span>
    </button>

    <!-- 下拉菜单（不支持 Web Share API 时显示） -->
    <div
      v-if="isOpen && !canNativeShare"
      class="share-overlay"
      @click="closeDropdown"
    />
    <div
      v-if="isOpen && !canNativeShare"
      class="share-dropdown"
    >
      <button
        class="share-option"
        @click="shareToTwitter"
      >
        <span class="option-icon">𝕏</span>
        <span>Twitter / X</span>
      </button>

      <button
        class="share-option"
        @click="shareToFacebook"
      >
        <span class="option-icon">f</span>
        <span>Facebook</span>
      </button>

      <button
        class="share-option"
        @click="shareToLinkedIn"
      >
        <span class="option-icon">in</span>
        <span>LinkedIn</span>
      </button>

      <button
        class="share-option"
        @click="shareToWeibo"
      >
        <span class="option-icon">微</span>
        <span>微博</span>
      </button>

      <div class="share-divider" />

      <button
        class="share-option"
        @click="copyLink"
      >
        <span class="option-icon">{{ copied ? '✓' : '🔗' }}</span>
        <span>{{ copied ? t('share.copied') : t('share.copyLink') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-container {
  position: relative;
  display: inline-block;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.share-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.share-icon {
  font-size: 1.25rem;
}

.share-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.share-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  z-index: 100;
  padding: 0.5rem;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  font-size: 0.875rem;
}

.share-option:hover {
  background: var(--bg-secondary);
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.share-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.375rem 0;
}
</style>
