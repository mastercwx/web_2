<script setup lang="ts">
import 'cropperjs/dist/cropper.css'
import Cropper from 'cropperjs'

defineProps<{
  currentAvatar?: string
}>()

const emit = defineEmits<{
  uploaded: [url: string]
}>()

const authStore = useAuthStore()
const uploading = ref(false)
const error = ref('')
const showCropper = ref(false)
const imagePreviewUrl = ref('')
const cropperInstance = ref<Cropper | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

// 触发文件选择
function triggerFileInput() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = handleFileSelect
  input.click()
}

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
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过 5MB'
    return
  }

  error.value = ''

  // 创建预览URL
  imagePreviewUrl.value = URL.createObjectURL(file)
  showCropper.value = true

  // 等待 DOM 更新后初始化裁剪器
  await nextTick()
  initCropper()
}

function initCropper() {
  if (imageRef.value) {
    cropperInstance.value = new Cropper(imageRef.value, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      background: false,
      responsive: true,
    })
  }
}

function cancelCrop() {
  showCropper.value = false
  imagePreviewUrl.value = ''
  if (cropperInstance.value) {
    cropperInstance.value.destroy()
    cropperInstance.value = null
  }
}

async function confirmCrop() {
  if (!cropperInstance.value) return

  uploading.value = true
  error.value = ''

  try {
    // 获取裁剪后的 canvas
    const canvas = cropperInstance.value.getCroppedCanvas({
      width: 200,
      height: 200,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    // 转换为 blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
    })

    // 创建 FormData
    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.jpg')

    // 上传
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
      const updateResult = await $fetch<{ code: number; data: { user: any } }>(
        '/api/users/avatar',
        {
          method: 'PUT',
          body: { avatar: result.data.url },
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        },
      )

      if (updateResult.code === 200) {
        authStore.setAuth(updateResult.data.user, authStore.token!)
        emit('uploaded', result.data.url)
        showCropper.value = false
      }
    }
  } catch (e: any) {
    error.value = e.message || '上传失败'
  } finally {
    uploading.value = false
    if (cropperInstance.value) {
      cropperInstance.value.destroy()
      cropperInstance.value = null
    }
  }
}

// 清理
onUnmounted(() => {
  if (cropperInstance.value) {
    cropperInstance.value.destroy()
  }
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})
</script>

<template>
  <div class="avatar-upload">
    <!-- 头像显示区域 -->
    <div
      class="avatar-wrapper"
      @click="triggerFileInput"
    >
      <img
        :src="currentAvatar || '/default-avatar.svg'"
        alt="头像"
        class="avatar-image"
      />
      <div class="avatar-overlay">
        <svg
          class="camera-icon"
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
        <span>更换头像</span>
      </div>
    </div>

    <!-- 裁剪弹窗 -->
    <div
      v-if="showCropper"
      class="cropper-modal"
      @click.self="cancelCrop"
    >
      <div class="cropper-container">
        <div class="cropper-header">
          <h3>裁剪头像</h3>
          <p>拖动和缩放选择头像区域</p>
        </div>

        <div class="cropper-body">
          <img
            ref="imageRef"
            :src="imagePreviewUrl"
            alt="待裁剪图片"
          />
        </div>

        <div class="cropper-footer">
          <button
            class="btn btn-secondary"
            @click="cancelCrop"
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="uploading"
            @click="confirmCrop"
          >
            {{ uploading ? '上传中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <p
      v-if="error"
      class="error-text"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid var(--border-color, #e5e7eb);
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  border-color: var(--color-primary, #3b82f6);
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
}

.camera-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.avatar-overlay span {
  font-size: 12px;
}

.cropper-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.cropper-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
}

.cropper-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.cropper-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.cropper-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.cropper-body {
  padding: 20px;
  max-height: 400px;
  overflow: hidden;
}

.cropper-body img {
  max-width: 100%;
  max-height: 350px;
  display: block;
}

.cropper-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover, #2563eb);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.error-text {
  color: #ef4444;
  font-size: 14px;
  margin: 0;
}
</style>
