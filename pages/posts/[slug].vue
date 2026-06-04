<script setup lang="ts">
const route = useRoute()
const slug = route.params['slug'] as string

const { data, error } = await useFetch(`/api/posts/${slug}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    message: error.value.message || '文章不存在',
  })
}

const post = computed(() => (data.value as any)?.data?.post)

// SEO 优化
useSeo({
  title: post.value?.title,
  description: post.value?.content?.substring(0, 160) || '',
  url: `/posts/${slug}`,
  type: 'article',
  publishedTime: post.value?.createdAt,
  modifiedTime: post.value?.updatedAt,
  author: post.value?.author?.username,
  tags: post.value?.tags?.map((t: any) => t.name),
})
</script>

<template>
  <div
    v-if="post"
    class="max-w-3xl mx-auto"
  >
    <article class="post-article">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-primary mb-4">
          {{ post.title }}
        </h1>
        <div class="flex items-center gap-4 text-sm text-secondary">
          <NuxtLink
            :to="`/users/${post.author.id}`"
            class="author-link"
          >
            {{ post.author.username }}
          </NuxtLink>
          <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
          <div
            v-if="post.tags.length"
            class="flex gap-2"
          >
            <span
              v-for="tag in post.tags"
              :key="tag.id"
              class="tag"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>
      </header>

      <div class="prose prose-lg max-w-none">
        <div
          class="post-content"
          v-html="post.content"
        />
      </div>

      <!-- 点赞收藏 -->
      <PostActions :post-id="post.id" />
    </article>

    <!-- 评论区 -->
    <CommentSection :post-id="post.id" />

    <div class="mt-8 flex justify-between">
      <NuxtLink
        to="/posts"
        class="text-primary hover:text-primary-hover"
      >
        ← 返回文章列表
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.post-article {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2rem;
}

.tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.post-content {
  color: var(--text-primary);
  line-height: 1.8;
}

.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
  color: var(--text-primary);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.post-content :deep(p) {
  margin-bottom: 1em;
}

.post-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.post-content :deep(code) {
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
  font-size: 0.875em;
}

.post-content :deep(pre) {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin-bottom: 1em;
}

.post-content :deep(pre code) {
  background: none;
  padding: 0;
}

.post-content :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding-left: 1rem;
  margin: 1em 0;
  color: var(--text-secondary);
}

.post-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-md);
  margin: 1em 0;
}

.text-primary {
  color: var(--color-primary);
}

.text-primary:hover {
  color: var(--color-primary-hover);
}

.author-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.author-link:hover {
  color: var(--color-primary);
}
</style>
