<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Tag {
  id: number
  name: string
  postCount: number
}

const { t } = useI18n()

const { data, error } = await useFetch<{ tags: Tag[] }>('/api/tags')

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    message: error.value.message || '加载失败',
  })
}

const tags = computed(() => data.value?.tags || [])

const sortBy = ref<'count' | 'name'>('count')
const order = ref<'asc' | 'desc'>('desc')

const sortedTags = computed(() => {
  const sorted = [...tags.value]
  if (sortBy.value === 'name') {
    sorted.sort((a, b) =>
      order.value === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    )
  } else {
    sorted.sort((a, b) =>
      order.value === 'asc' ? a.postCount - b.postCount : b.postCount - a.postCount,
    )
  }
  return sorted
})

function toggleSort(by: 'count' | 'name') {
  if (sortBy.value === by) {
    order.value = order.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = by
    order.value = 'desc'
  }
}

function getTagSize(count: number) {
  const maxCount = Math.max(...tags.value.map((t) => t.postCount), 1)
  const ratio = count / maxCount
  return 0.875 + ratio * 1.5 // 0.875rem to 2.375rem
}
</script>

<template>
  <div class="tags-page">
    <div class="page-header">
      <h1>{{ t('tags.title') }}</h1>
      <p class="page-description">
        {{ t('tags.description') }}
      </p>
    </div>

    <!-- 排序选项 -->
    <div class="sort-options">
      <span class="sort-label">{{ t('tags.sortBy') }}:</span>
      <button
        class="sort-btn"
        :class="{ active: sortBy === 'count' }"
        @click="toggleSort('count')"
      >
        {{ t('tags.postCount') }}
        <span
          v-if="sortBy === 'count'"
          class="sort-icon"
        >
          {{ order === 'asc' ? '↑' : '↓' }}
        </span>
      </button>
      <button
        class="sort-btn"
        :class="{ active: sortBy === 'name' }"
        @click="toggleSort('name')"
      >
        {{ t('tags.name') }}
        <span
          v-if="sortBy === 'name'"
          class="sort-icon"
        >
          {{ order === 'asc' ? '↑' : '↓' }}
        </span>
      </button>
    </div>

    <!-- 标签云 -->
    <div
      v-if="sortedTags.length > 0"
      class="tags-cloud"
    >
      <NuxtLink
        v-for="tag in sortedTags"
        :key="tag.id"
        :to="`/tags/${tag.name}`"
        class="tag-item"
        :style="{ fontSize: `${getTagSize(tag.postCount)}rem` }"
      >
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-count">({{ tag.postCount }})</span>
      </NuxtLink>
    </div>

    <div
      v-else
      class="empty"
    >
      {{ t('tags.noTags') }}
    </div>

    <!-- 标签列表 -->
    <div class="tags-list-section">
      <h2>{{ t('tags.allTags') }}</h2>
      <div class="tags-list">
        <NuxtLink
          v-for="tag in sortedTags"
          :key="tag.id"
          :to="`/tags/${tag.name}`"
          class="tag-card card"
        >
          <div class="tag-info">
            <span class="tag-card-name">{{ tag.name }}</span>
            <span class="tag-card-count"> {{ tag.postCount }} {{ t('tags.posts') }} </span>
          </div>
          <div class="tag-arrow">→</div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tags-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.page-description {
  color: var(--text-secondary);
  margin: 0;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.sort-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.sort-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sort-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.sort-icon {
  margin-left: 0.25rem;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
}

.tag-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 9999px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s;
}

.tag-item:hover {
  background: var(--color-primary);
  color: white;
}

.tag-item:hover .tag-count {
  color: rgba(255, 255, 255, 0.8);
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  font-size: 0.75em;
  color: var(--text-secondary);
}

.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.tags-list-section {
  margin-top: 2rem;
}

.tags-list-section h2 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
}

.tags-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.tag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s;
}

.tag-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tag-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tag-card-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
}

.tag-card-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.tag-arrow {
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.tag-card:hover .tag-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .tags-list {
    grid-template-columns: 1fr;
  }
}
</style>
