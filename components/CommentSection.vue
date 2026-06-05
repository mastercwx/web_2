<script setup lang="ts">
interface Comment {
  id: number
  content: string
  createdAt: string
  author: {
    id: number
    username: string
    avatar: string | null
  }
  replies?: Comment[]
}

const props = defineProps<{
  postId: number
}>()

const authStore = useAuthStore()

const comments = ref<Comment[]>([])
const newComment = ref('')
const loading = ref(false)
const submitting = ref(false)
const replyingTo = ref<number | null>(null)
const replyContent = ref('')
const replySubmitting = ref(false)

// 获取评论
async function fetchComments() {
  loading.value = true
  try {
    const data = await $fetch(`/api/comments?postId=${props.postId}`)
    comments.value = (data as any).data.comments || []
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loading.value = false
  }
}

// 提交评论
async function handleSubmit() {
  if (!newComment.value.trim()) return

  submitting.value = true
  try {
    const data = await $fetch('/api/comments', {
      method: 'POST',
      body: {
        content: newComment.value,
        postId: props.postId,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    const comment = (data as any).data.comment
    comments.value.unshift(comment)
    newComment.value = ''
  } catch (error: any) {
    alert(error.message || '评论失败')
  } finally {
    submitting.value = false
  }
}

// 提交回复
async function handleReply(parentId: number) {
  if (!replyContent.value.trim()) return

  replySubmitting.value = true
  try {
    const data = await $fetch('/api/comments', {
      method: 'POST',
      body: {
        content: replyContent.value,
        postId: props.postId,
        parentId,
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    const comment = (data as any).data.comment

    // 找到父评论并添加回复
    const parentComment = comments.value.find((c) => c.id === parentId)
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = []
      }
      parentComment.replies.push(comment)
    }

    replyContent.value = ''
    replyingTo.value = null
  } catch (error: any) {
    alert(error.message || '回复失败')
  } finally {
    replySubmitting.value = false
  }
}

// 删除评论
async function handleDelete(commentId: number) {
  if (!confirm('确定要删除这条评论吗？')) return

  try {
    await $fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    // 从列表中移除评论
    comments.value = comments.value.filter((c) => c.id !== commentId)

    // 也从回复中移除
    comments.value.forEach((comment) => {
      if (comment.replies) {
        comment.replies = comment.replies.filter((r) => r.id !== commentId)
      }
    })
  } catch (error: any) {
    alert(error.message || '删除失败')
  }
}

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 初始化
onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="comment-section">
    <h3 class="text-lg font-semibold text-primary mb-4">评论 ({{ comments.length }})</h3>

    <!-- 评论表单 -->
    <div
      v-if="authStore.isAuthenticated"
      class="comment-form"
    >
      <textarea
        v-model="newComment"
        class="input"
        rows="3"
        placeholder="写下你的评论..."
        maxlength="1000"
      />
      <div class="flex justify-between items-center mt-2">
        <span class="text-xs text-tertiary"> {{ newComment.length }}/1000 </span>
        <button
          class="btn-primary"
          :disabled="!newComment.trim() || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '发送中...' : '发表评论' }}
        </button>
      </div>
    </div>
    <div
      v-else
      class="login-hint"
    >
      <p class="text-secondary">
        请
        <NuxtLink
          to="/login"
          class="text-primary"
        >
          登录
        </NuxtLink>
        后发表评论
      </p>
    </div>

    <!-- 评论列表 -->
    <div
      v-if="loading"
      class="text-center py-8 text-secondary"
    >
      加载中...
    </div>
    <div
      v-else-if="comments.length === 0"
      class="text-center py-8 text-secondary"
    >
      暂无评论，快来发表第一条评论吧！
    </div>
    <div
      v-else
      class="comment-list"
    >
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item"
      >
        <div class="comment-header">
          <div class="flex items-center gap-2">
            <img
              :src="comment.author.avatar || '/default-avatar.svg'"
              :alt="comment.author.username"
              class="avatar"
            />
            <span class="font-medium text-primary">
              {{ comment.author.username }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-tertiary">
              {{ formatDate(comment.createdAt) }}
            </span>
            <button
              v-if="authStore.isAuthenticated"
              class="text-xs text-blue-500 hover:text-blue-700"
              @click="replyingTo = replyingTo === comment.id ? null : comment.id"
            >
              {{ replyingTo === comment.id ? '取消回复' : '回复' }}
            </button>
            <button
              v-if="
                authStore.isAuthenticated &&
                (authStore.user?.id === comment.author.id || authStore.user?.role === 'ADMIN')
              "
              class="text-xs text-red-500 hover:text-red-700"
              @click="handleDelete(comment.id)"
            >
              删除
            </button>
          </div>
        </div>
        <p class="comment-content">
          {{ comment.content }}
        </p>

        <!-- 回复表单 -->
        <div
          v-if="replyingTo === comment.id && authStore.isAuthenticated"
          class="reply-form"
        >
          <textarea
            v-model="replyContent"
            class="input"
            rows="2"
            placeholder="写下你的回复..."
            maxlength="1000"
          />
          <div class="flex justify-end gap-2 mt-2">
            <button
              class="btn-secondary"
              @click="replyingTo = null"
            >
              取消
            </button>
            <button
              class="btn-primary"
              :disabled="!replyContent.trim() || replySubmitting"
              @click="handleReply(comment.id)"
            >
              {{ replySubmitting ? '发送中...' : '回复' }}
            </button>
          </div>
        </div>

        <!-- 回复列表 -->
        <div
          v-if="comment.replies && comment.replies.length > 0"
          class="reply-list"
        >
          <div
            v-for="reply in comment.replies"
            :key="reply.id"
            class="reply-item"
          >
            <div class="comment-header">
              <div class="flex items-center gap-2">
                <img
                  :src="reply.author.avatar || '/default-avatar.svg'"
                  :alt="reply.author.username"
                  class="avatar-sm"
                />
                <span class="font-medium text-primary text-sm">
                  {{ reply.author.username }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-tertiary">
                  {{ formatDate(reply.createdAt) }}
                </span>
                <button
                  v-if="
                    authStore.isAuthenticated &&
                    (authStore.user?.id === reply.author.id || authStore.user?.role === 'ADMIN')
                  "
                  class="text-xs text-red-500 hover:text-red-700"
                  @click="handleDelete(reply.id)"
                >
                  删除
                </button>
              </div>
            </div>
            <p class="comment-content text-sm">
              {{ reply.content }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.comment-form {
  margin-bottom: 2rem;
}

.comment-form .input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: vertical;
  min-height: 80px;
}

.comment-form .input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.comment-form .input::placeholder {
  color: var(--text-tertiary);
}

.login-hint {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-align: center;
  margin-bottom: 2rem;
}

.login-hint .text-primary {
  font-weight: 500;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.reply-form {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.reply-form .input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: vertical;
  min-height: 60px;
  font-size: 0.875rem;
}

.reply-form .input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.reply-list {
  margin-top: 0.75rem;
  padding-left: 1.5rem;
  border-left: 2px solid var(--border-color);
}

.reply-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.avatar-sm {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  color: var(--text-inverse);
  background: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
