<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()

// 设置页面标题
useHead({
  title: props.error?.statusCode === 404 ? '页面未找到 - HG Web' : '服务器错误 - HG Web',
})

const handleError = () => {
  clearError({ redirect: '/' })
}

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    clearError({ redirect: '/' })
  }
}
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-illustration">
        <div class="error-code">
          <template v-if="error?.statusCode === 404">
            <span class="digit">4</span>
            <span class="digit zero">0</span>
            <span class="digit">4</span>
          </template>
          <template v-else-if="error?.statusCode === 403">
            <span class="digit">4</span>
            <span class="digit zero">0</span>
            <span class="digit">3</span>
          </template>
          <template v-else>
            <span class="digit">5</span>
            <span class="digit zero">0</span>
            <span class="digit">0</span>
          </template>
        </div>
      </div>

      <h1 class="error-title">
        <template v-if="error?.statusCode === 404">
          {{ t('errors.404') || '页面未找到' }}
        </template>
        <template v-else-if="error?.statusCode === 403">
          {{ t('errors.403') || '访问被拒绝' }}
        </template>
        <template v-else>
          {{ t('errors.500') || '服务器错误' }}
        </template>
      </h1>

      <p class="error-message">
        <template v-if="error?.statusCode === 404">
          {{ t('errors.notFoundMessage') || '抱歉，您访问的页面不存在或已被移除' }}
        </template>
        <template v-else-if="error?.statusCode === 403">
          {{ t('errors.forbiddenMessage') || '抱歉，您没有权限访问此页面' }}
        </template>
        <template v-else>
          {{ t('errors.serverErrorMessage') || '抱歉，服务器出现了问题，请稍后再试' }}
        </template>
      </p>

      <div
        v-if="error?.message && error?.statusCode !== 404 && error?.statusCode !== 403"
        class="error-details"
      >
        <p>{{ error.message }}</p>
      </div>

      <div class="error-actions">
        <NuxtLink
          to="/"
          class="btn btn-primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {{ t('errors.goHome') || '返回首页' }}
        </NuxtLink>
        <button
          class="btn btn-secondary"
          @click="goBack"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line
              x1="19"
              y1="12"
              x2="5"
              y2="12"
            />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回上页
        </button>
        <button
          class="btn btn-secondary"
          @click="handleError"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          刷新页面
        </button>
      </div>

      <div class="error-help">
        <p>您可以尝试：</p>
        <ul>
          <li>检查网址是否正确</li>
          <li>返回首页重新导航</li>
          <li>使用搜索功能查找内容</li>
          <li><NuxtLink to="/contact">联系我们</NuxtLink>获取帮助</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary, #fff);
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 600px;
}

.error-illustration {
  margin-bottom: 2rem;
}

.error-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.digit {
  font-size: 8rem;
  font-weight: 800;
  color: var(--primary, #3b82f6);
  line-height: 1;
  text-shadow: 4px 4px 0 rgba(59, 130, 246, 0.2);
}

.digit.zero {
  color: var(--text-secondary, #6b7280);
  text-shadow: 4px 4px 0 rgba(107, 114, 128, 0.2);
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin-bottom: 0.75rem;
}

.error-message {
  font-size: 1.125rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-details {
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.error-details p {
  font-size: 0.875rem;
  color: var(--text-muted, #9ca3af);
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn svg {
  width: 20px;
  height: 20px;
}

.btn-primary {
  background: var(--primary, #3b82f6);
  color: #fff;
}

.btn-primary:hover {
  background: var(--primary-dark, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #111827);
  border: 1px solid var(--border-color, #e5e7eb);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, #e5e7eb);
  transform: translateY(-2px);
}

.error-help {
  text-align: left;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 12px;
  padding: 1.5rem;
}

.error-help p {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 0.75rem;
}

.error-help ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-help li {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.error-help li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary, #3b82f6);
}

.error-help a {
  color: var(--primary, #3b82f6);
  text-decoration: none;
}

.error-help a:hover {
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 640px) {
  .digit {
    font-size: 5rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-message {
    font-size: 1rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* 动画 */
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.digit {
  animation: bounce 2s ease-in-out infinite;
}

.digit:nth-child(2) {
  animation-delay: 0.2s;
}

.digit:nth-child(3) {
  animation-delay: 0.4s;
}
</style>
