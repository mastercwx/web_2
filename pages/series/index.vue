<script setup lang="ts">
const series = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)

// 获取系列列表
async function fetchSeries() {
  loading.value = true
  try {
    const data = await $fetch(`/api/series?page=${page.value}&limit=12`)
    const result = (data as any).data
    series.value = result.series
    totalPages.value = result.totalPages
  } catch (error) {
    console.error('获取系列失败:', error)
  } finally {
    loading.value = false
  }
}

// 翻页
function prevPage() {
  if (page.value > 1) {
    page.value--
    fetchSeries()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    fetchSeries()
  }
}

onMounted(() => {
  fetchSeries()
})
</script>

<template>
  <div class="series-page">
    <div class="page-header">
      <h1>文章系列</h1>
      <p class="page-description">浏览所有文章系列，系统化学习知识</p>
    </div>

    <div
      v-if="loading"
      class="loading-state"
    >
      加载中...
    </div>

    <div
      v-else-if="series.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">📚</div>
      <p>暂无文章系列</p>
    </div>

    <div
      v-else
      class="series-grid"
    >
      <NuxtLink
        v-for="item in series"
        :key="item.id"
        :to="`/series/${item.slug}`"
        class="series-card"
      >
        <div class="series-cover">
          <img
            v-if="item.coverImage"
            :src="item.coverImage"
            :alt="item.title"
          />
          <div
            v-else
            class="default-cover"
          >
            📚
          </div>
        </div>
        <div class="series-info">
          <h2 class="series-title">
            {{ item.title }}
          </h2>
          <p
            v-if="item.description"
            class="series-description"
          >
            {{ item.description }}
          </p>
          <div class="series-meta">
            <span class="post-count"> {{ item._count.posts }} 篇文章 </span>
            <span class="author">
              {{ item.author.username }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- 分页 -->
    <div
      v-if="totalPages > 1"
      class="pagination"
    >
      <button
        :disabled="page <= 1"
        @click="prevPage"
      >
        上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button
        :disabled="page >= totalPages"
        @click="nextPage"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<style scoped>
.series-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
  font-size: 1rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.series-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-fast);
  text-decoration: none;
  color: inherit;
}

.series-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.series-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.series-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  font-size: 3rem;
}

.series-info {
  padding: 1.25rem;
}

.series-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
