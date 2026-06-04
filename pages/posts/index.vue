<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

useSeo({
  title: t('nav.posts'),
  description: t('posts.title'),
  url: '/posts',
})

const page = ref(Number(route.query['page']) || 1)
const search = ref((route.query['search'] as string) || '')
const selectedTag = ref((route.query['tag'] as string) || '')

const { data, refresh } = await useFetch('/api/posts', {
  query: {
    page,
    pageSize: 10,
    search,
    tag: selectedTag,
  },
})

const { data: tagsData } = await useFetch('/api/tags')

const posts = computed(() => (data.value as any)?.data?.posts || [])
const pagination = computed(() => (data.value as any)?.data?.pagination || {})
const tags = computed(() => (tagsData.value as any)?.data?.tags || [])

function handleSearch() {
  page.value = 1
  refresh()
}

function handleTagSelect(tagName: string) {
  selectedTag.value = selectedTag.value === tagName ? '' : tagName
  page.value = 1
  refresh()
}

function handlePageChange(newPage: number) {
  page.value = newPage
  refresh()
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">文章列表</h1>
      <NuxtLink
        to="/posts/create"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        写文章
      </NuxtLink>
    </div>

    <!-- 搜索和筛选 -->
    <div class="mb-6 space-y-4">
      <div class="flex gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="搜索文章..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleSearch"
        />
        <button
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>

      <!-- 标签筛选 -->
      <div
        v-if="tags.length"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="tag in tags"
          :key="tag.id"
          class="px-3 py-1 text-sm rounded-full border transition-colors"
          :class="
            selectedTag === tag.name
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
          "
          @click="handleTagSelect(tag.name)"
        >
          {{ tag.name }}
          <span class="ml-1 opacity-75">({{ tag._count.posts }})</span>
        </button>
      </div>
    </div>

    <!-- 文章列表 -->
    <div
      v-if="posts.length"
      class="space-y-6"
    >
      <article
        v-for="post in posts"
        :key="post.id"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <NuxtLink
          :to="`/posts/${post.slug}`"
          class="block"
        >
          <h2 class="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
            {{ post.title }}
          </h2>
        </NuxtLink>
        <p class="text-gray-600 mb-4 line-clamp-3">{{ post.content.substring(0, 200) }}...</p>
        <div class="flex items-center justify-between text-sm text-gray-500">
          <div class="flex items-center gap-4">
            <span>{{ post.author.username }}</span>
            <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
          </div>
          <div
            v-if="post.tags.length"
            class="flex gap-2"
          >
            <NuxtLink
              v-for="tag in post.tags"
              :key="tag.id"
              :to="`/tags/${tag.name}`"
              class="px-2 py-0.5 bg-gray-100 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              {{ tag.name }}
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="text-center py-12 text-gray-500"
    >
      暂无文章
    </div>

    <!-- 分页 -->
    <div
      v-if="pagination.totalPages > 1"
      class="mt-8 flex justify-center gap-2"
    >
      <button
        v-for="p in pagination.totalPages"
        :key="p"
        class="px-4 py-2 rounded-md transition-colors"
        :class="p === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
        @click="handlePageChange(p)"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>
