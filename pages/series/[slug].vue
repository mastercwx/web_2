<script setup lang="ts">
const route = useRoute()
const slug = route.params['slug'] as string

const { data, error } = await useFetch(`/api/series/${slug}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    message: error.value.message || '系列不存在',
  })
}

const series = computed(() => (data.value as any)?.data?.series)

// SEO 优化
useSeo({
  title: series.value?.title,
  description: series.value?.description || '',
  url: `/series/${slug}`,
})
</script>

<template>
  <div
    v-if="series"
    class="series-detail-page"
  >
    <div class="series-header">
      <div class="series-cover">
        <img
          v-if="series.coverImage"
          :src="series.coverImage"
          :alt="series.title"
        />
        <div
          v-else
          class="default-cover"
        >
          📚
        </div>
      </div>
      <div class="series-info">
        <h1 class="series-title">
          {{ series.title }}
        </h1>
        <p
          v-if="series.description"
          class="series-description"
        >
          {{ series.description }}
        </p>
        <div class="series-meta">
          <NuxtLink
            :to="`/users/${series.author.id}`"
            class="author-link"
          >
            {{ series.author.username }}
          </NuxtLink>
          <span class="separator"> · </span>
          <span class="post-count"> {{ series.posts.length }} 篇文章 </span>
        </div>
      </div>
    </div>

    <div class="series-posts">
      <h2 class="section-title">系列文章</h2>
      <div class="post-list">
        <NuxtLink
          v-for="(post, index) in series.posts"
          :key="post.id"
          :to="`/posts/${post.slug}`"
          class="post-item"
        >
          <span class="post-number">
            {{ post.seriesOrder || index + 1 }}
          </span>
          <div class="post-info">
            <h3 class="post-title">
              {{ post.title }}
            </h3>
            <div class="post-meta">
              <span class="post-date">
                {{ new Date(post.createdAt).toLocaleDateString() }}
              </span>
              <span class="post-stats">
                {{ post._count.comments }} 评论 · {{ post._count.likes }} 点赞
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="mt-8">
      <NuxtLink
        to="/series"
        class="text-primary hover:text-primary-hover"
      >
        ← 返回系列列表
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.series-detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.series-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.series-cover {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
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
  flex: 1;
}

.series-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.series-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.series-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.author-link {
  color: var(--color-primary);
  text-decoration: none;
}

.author-link:hover {
  text-decoration: underline;
}

.separator {
  color: var(--text-tertiary);
}

.series-posts {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-fast);
}

.post-item:hover {
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-sm);
}

.post-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-primary);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50%;
  flex-shrink: 0;
}

.post-info {
  flex: 1;
}

.post-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.mt-8 {
  margin-top: 2rem;
}

.text-primary {
  color: var(--color-primary);
}

.text-primary:hover {
  color: var(--color-primary-hover);
}

@media (max-width: 640px) {
  .series-header {
    flex-direction: column;
  }

  .series-cover {
    width: 100%;
    height: 200px;
  }
}
</style>
