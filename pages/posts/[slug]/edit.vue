<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const slug = route.params['slug'] as string

const { data, error: fetchError } = await useFetch(`/api/posts/${slug}`)

if (fetchError.value) {
  throw createError({
    statusCode: fetchError.value.statusCode || 404,
    message: fetchError.value.message || '文章不存在',
  })
}

const post = computed(() => (data.value as any)?.data?.post)

const form = reactive({
  title: post.value?.title || '',
  content: post.value?.content || '',
  published: post.value?.published || false,
})

const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!form.title || !form.content) {
    error.value = '标题和内容不能为空'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data: updateData, error: updateError } = await useFetch(`/api/posts/${slug}`, {
      method: 'PUT',
      body: form,
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (updateError.value) {
      throw new Error(updateError.value.message || '更新失败')
    }

    const result = updateData.value as any
    if (result?.code === 200) {
      router.push(`/posts/${result.data.post.slug}`)
    }
  } catch (e: any) {
    error.value = e.message || '更新失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">编辑文章</h1>

    <form
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <div
        v-if="error"
        class="rounded-md bg-red-50 p-4"
      >
        <p class="text-sm text-red-800">
          {{ error }}
        </p>
      </div>

      <div>
        <label
          for="title"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          标题
        </label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="文章标题"
        />
      </div>

      <div>
        <label
          for="content"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          内容
        </label>
        <textarea
          id="content"
          v-model="form.content"
          required
          rows="15"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="文章内容"
        />
      </div>

      <div class="flex items-center">
        <input
          id="published"
          v-model="form.published"
          type="checkbox"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          for="published"
          class="ml-2 block text-sm text-gray-900"
        >
          发布文章
        </label>
      </div>

      <div class="flex justify-end gap-4">
        <NuxtLink
          :to="`/posts/${slug}`"
          class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          取消
        </NuxtLink>
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </form>
  </div>
</template>
