<template>
  <div class="offline-page">
    <div class="offline-content">
      <div class="offline-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line
            x1="1"
            y1="1"
            x2="23"
            y2="23"
          />
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0122.56 9" />
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
          <path d="M8.53 16.11a6 6 0 016.95 0" />
          <line
            x1="12"
            y1="20"
            x2="12.01"
            y2="20"
          />
        </svg>
      </div>
      <h1>{{ $t('pwa.offlineTitle') }}</h1>
      <p>{{ $t('pwa.offlineDescription') }}</p>
      <button
        class="btn-retry"
        @click="retry"
      >
        {{ $t('pwa.retry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

function retry() {
  window.location.reload()
}
</script>

<style scoped>
.offline-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.offline-content {
  text-align: center;
  padding: 40px;
}

.offline-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  color: var(--text-secondary);
}

.offline-icon svg {
  width: 100%;
  height: 100%;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

.btn-retry {
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-primary-hover);
}
</style>
