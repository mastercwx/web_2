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
</script>

<template>
  <div
    v-if="post"
    class="max-w-3xl mx-auto"
  >
    <article class="bg-white rounded-lg shadow-md p-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          {{ post.title }}
        </h1>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>{{ post.author.username }}</span>
          <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
          <div
            v-if="post.tags.length"
            class="flex gap-2"
          >
            <span
              v-for="tag in post.tags"
              :key="tag.id"
              class="px-2 py-0.5 bg-gray-100 rounded"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>
      </header>

      <div class="prose prose-lg max-w-none">
        <div v-html="post.content" />
      </div>
    </article>

    <div class="mt-8 flex justify-between">
      <NuxtLink
        to="/posts"
        class="text-blue-600 hover:text-blue-800"
      >
        ← 返回文章列表
      </NuxtLink>
    </div>
  </div>
</template>
