<script setup lang="ts">
defineProps<{
  currentAvatar?: string
}>()

const emit = defineEmits<{
  uploaded: [url: string]
}>()

const authStore = useAuthStore()
const uploading = ref(false)
const error = ref('')

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = '请选择 JPG、PNG、GIF 或 WebP 格式的图片'
    return
  }

  // 验证文件大小
  if (file.size > 2 * 1024 * 1024) {
    error.value = '图片大小不能超过 2MB'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const { data, error: uploadError } = await useFetch('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    if (uploadError.value) {
      throw new Error(uploadError.value.message || '上传失败')
    }

    const result = data.value as any
    if (result?.code === 200) {
      // 更新用户头像
      await $fetch('/api/users/avatar', {
        method: 'PUT',
        body: { avatar: result.data.url },
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      emit('uploaded', result.data.url)
    }
  } catch (e: any) {
    error.value = e.message || '上传失败'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="relative">
      <img
        :src="currentAvatar || '/default-avatar.png'"
        alt="头像"
        class="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
      />
      <label
        class="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700"
        :class="{ 'opacity-50 cursor-not-allowed': uploading }"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <input
          type="file"
          accept="image/*"
          class="hidden"
          :disabled="uploading"
          @change="handleFileSelect"
        />
      </label>
    </div>

    <p
      v-if="uploading"
      class="text-sm text-blue-600"
    >
      上传中...
    </p>
    <p
      v-if="error"
      class="text-sm text-red-600"
    >
      {{ error }}
    </p>
  </div>
</template>
