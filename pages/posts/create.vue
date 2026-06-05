<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  middleware: ['auth'],
})

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  title: '',
  content: '',
  published: false,
  scheduledAt: '',
  seriesId: null as number | null,
  seriesOrder: null as number | null,
})

const loading = ref(false)
const error = ref('')
const userSeries = ref<any[]>([])

// 获取用户的系列列表
async function fetchUserSeries() {
  try {
    const data = await $fetch(`/api/series?authorId=${authStore.user?.id}&limit=100`)
    userSeries.value = (data as any).data.series
  } catch (err) {
    console.error('获取系列失败:', err)
  }
}

async function handleSubmit() {
  if (!form.title || !form.content) {
    error.value = t('posts.createPage.titleContentRequired')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const body: any = {
      title: form.title,
      content: form.content,
      published: form.published,
    }

    // 如果设置了定时发布时间
    if (form.scheduledAt) {
      body.scheduledAt = new Date(form.scheduledAt).toISOString()
      body.published = false
    }

    // 如果选择了系列
    if (form.seriesId) {
      body.seriesId = form.seriesId
      body.seriesOrder = form.seriesOrder
    }

    const { data, error: fetchError } = await useFetch('/api/posts', {
      method: 'POST',
      body,
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (fetchError.value) {
      throw new Error(fetchError.value.message || t('posts.createPage.createFailed'))
    }

    const result = data.value as any
    if (result?.code === 200) {
      router.push(`/posts/${result.data.post.slug}`)
    }
  } catch (e: any) {
    error.value = e.message || t('posts.createPage.createFailed')
  } finally {
    loading.value = false
  }
}

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

onMounted(() => {
  fetchUserSeries()
})
</script>

<template>
  <div class="create-post-page">
    <h1>{{ t('posts.createPage.title') }}</h1>

    <form
      class="post-form"
      @submit.prevent="handleSubmit"
    >
      <div
        v-if="error"
        class="error-message"
      >
        {{ error }}
      </div>

      <div class="form-group">
        <label for="title">{{ t('posts.createPage.titleLabel') }}</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          :placeholder="t('posts.createPage.titlePlaceholder')"
        />
      </div>

      <div class="form-group">
        <label for="content">{{ t('posts.createPage.contentLabel') }}</label>
        <textarea
          id="content"
          v-model="form.content"
          required
          rows="15"
          :placeholder="t('posts.createPage.contentPlaceholder')"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <div class="checkbox-label">
            <input
              id="published"
              v-model="form.published"
              type="checkbox"
              :disabled="!!form.scheduledAt"
            />
            <label for="published">{{ t('posts.createPage.publishNow') }}</label>
          </div>
        </div>

        <div class="form-group">
          <label for="scheduledAt">{{ t('posts.createPage.scheduledAt') }}</label>
          <input
            id="scheduledAt"
            v-model="form.scheduledAt"
            type="datetime-local"
            :min="minDateTime"
          />
          <p class="form-hint">
            {{ t('posts.createPage.scheduledHint') }}
          </p>
        </div>
      </div>

      <div
        v-if="userSeries.length > 0"
        class="form-row"
      >
        <div class="form-group">
          <label for="series">{{ t('posts.createPage.seriesLabel') }}</label>
          <select
            id="series"
            v-model="form.seriesId"
          >
            <option :value="null">
              {{ t('posts.createPage.noSeries') }}
            </option>
            <option
              v-for="s in userSeries"
              :key="s.id"
              :value="s.id"
            >
              {{ s.title }}
            </option>
          </select>
        </div>

        <div
          v-if="form.seriesId"
          class="form-group"
        >
          <label for="seriesOrder">{{ t('posts.createPage.seriesOrder') }}</label>
          <input
            id="seriesOrder"
            v-model.number="form.seriesOrder"
            type="number"
            min="1"
            placeholder="1"
          />
          <p class="form-hint">
            {{ t('posts.createPage.seriesOrderHint') }}
          </p>
        </div>
      </div>

      <div class="form-actions">
        <NuxtLink
          to="/posts"
          class="btn-cancel"
        >
          {{ t('common.cancel') }}
        </NuxtLink>
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? t('posts.createPage.submitting') : t('posts.createPage.submit') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-post-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 2rem;
}

.post-form {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input[type='text'],
.form-group textarea,
.form-group input[type='datetime-local'] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 300px;
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
}

.checkbox-label label {
  margin-bottom: 0;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--border-color);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
