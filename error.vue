<script setup lang="ts">
defineProps<{
  error: {
    statusCode: number
    message: string
  }
}>()

const { t } = useI18n()

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center error-layout">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold error-code">
          {{ error.statusCode }}
        </h1>
        <p class="text-2xl text-primary mt-4">
          <template v-if="error.statusCode === 404">
            {{ t('errors.404') }}
          </template>
          <template v-else-if="error.statusCode === 403">
            {{ t('errors.403') }}
          </template>
          <template v-else-if="error.statusCode === 500">
            {{ t('errors.500') }}
          </template>
          <template v-else>
            {{ error.message || t('errors.default') }}
          </template>
        </p>
      </div>

      <div class="space-y-4">
        <button
          class="btn-primary"
          @click="handleError"
        >
          {{ t('errors.goHome') }}
        </button>

        <p class="text-sm text-secondary">
          <template v-if="error.statusCode === 404">
            {{ t('errors.notFoundMessage') }}
          </template>
          <template v-else-if="error.statusCode === 403">
            {{ t('errors.forbiddenMessage') }}
          </template>
          <template v-else-if="error.statusCode === 500">
            {{ t('errors.serverErrorMessage') }}
          </template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-layout {
  background: var(--bg-secondary);
}

.error-code {
  color: var(--text-tertiary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  color: var(--text-inverse);
  background: var(--color-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}
</style>
