<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const authStore = useAuthStore()

// 检查管理员权限
if (!authStore.isAuthenticated || authStore.user?.role !== 'ADMIN') {
  throw createError({ statusCode: 403, message: '没有权限' })
}

const activeTab = ref<'comments' | 'reports'>('comments')
const comments = ref<any[]>([])
const reports = ref<any[]>([])
const loading = ref(true)
const commentPage = ref(1)
const reportPage = ref(1)
const commentTotalPages = ref(1)
const reportTotalPages = ref(1)
const commentStatus = ref('PENDING')
const reportStatus = ref('pending')

// 获取待审核评论
async function fetchComments() {
  loading.value = true
  try {
    const data = await $fetch(
      `/api/moderation/comments?page=${commentPage.value}&status=${commentStatus.value}`,
    )
    const result = (data as any).data
    comments.value = result.comments
    commentTotalPages.value = result.totalPages
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取举报
async function fetchReports() {
  loading.value = true
  try {
    const data = await $fetch(
      `/api/moderation/reports?page=${reportPage.value}&status=${reportStatus.value}`,
    )
    const result = (data as any).data
    reports.value = result.reports
    reportTotalPages.value = result.totalPages
  } catch (error) {
    console.error('获取举报失败:', error)
  } finally {
    loading.value = false
  }
}

// 审核评论
async function moderateComment(commentId: number, status: string) {
  try {
    await $fetch(`/api/moderation/comments/${commentId}`, {
      method: 'PUT',
      body: { status },
    })
    // 刷新列表
    fetchComments()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

// 处理举报
async function resolveReport(reportId: number, status: string, action?: string) {
  try {
    await $fetch(`/api/moderation/reports/${reportId}`, {
      method: 'PUT',
      body: { status, action },
    })
    // 刷新列表
    fetchReports()
  } catch (error) {
    console.error('处理失败:', error)
  }
}

// 格式化时间
function formatTime(date: string) {
  return new Date(date).toLocaleString()
}

// 获取举报原因
function getReasonLabel(reason: string) {
  const reasons: Record<string, string> = {
    spam: '垃圾内容/广告',
    abuse: '辱骂/骚扰',
    inappropriate: '不当内容',
    copyright: '版权侵犯',
    other: '其他原因',
  }
  return reasons[reason] || reason
}

// 监听标签切换
watch(activeTab, (tab) => {
  if (tab === 'comments') {
    fetchComments()
  } else {
    fetchReports()
  }
})

// 监听状态筛选
watch(commentStatus, () => {
  commentPage.value = 1
  fetchComments()
})

watch(reportStatus, () => {
  reportPage.value = 1
  fetchReports()
})

onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="moderation-page">
    <h1>内容审核</h1>

    <div class="tabs">
      <button
        :class="{ active: activeTab === 'comments' }"
        @click="activeTab = 'comments'"
      >
        评论审核
      </button>
      <button
        :class="{ active: activeTab === 'reports' }"
        @click="activeTab = 'reports'"
      >
        举报处理
      </button>
    </div>

    <!-- 评论审核 -->
    <div
      v-if="activeTab === 'comments'"
      class="tab-content"
    >
      <div class="filters">
        <select v-model="commentStatus">
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已批准</option>
          <option value="REJECTED">已拒绝</option>
        </select>
      </div>

      <div
        v-if="loading"
        class="loading-state"
      >
        加载中...
      </div>

      <div
        v-else-if="comments.length === 0"
        class="empty-state"
      >
        暂无评论
      </div>

      <div
        v-else
        class="comment-list"
      >
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-card"
        >
          <div class="comment-header">
            <div class="comment-author">
              <img
                v-if="comment.author.avatar"
                :src="comment.author.avatar"
                :alt="comment.author.username"
                class="author-avatar"
              />
              <span class="author-name">{{ comment.author.username }}</span>
            </div>
            <div class="comment-meta">
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              <span
                v-if="comment._count.reports > 0"
                class="report-count"
              >
                {{ comment._count.reports }} 次举报
              </span>
            </div>
          </div>

          <div class="comment-content">
            {{ comment.content }}
          </div>

          <div class="comment-post">
            文章：<NuxtLink :to="`/posts/${comment.post.slug}`">
              {{ comment.post.title }}
            </NuxtLink>
          </div>

          <div class="comment-actions">
            <button
              v-if="comment.status !== 'APPROVED'"
              class="btn-approve"
              @click="moderateComment(comment.id, 'APPROVED')"
            >
              批准
            </button>
            <button
              v-if="comment.status !== 'REJECTED'"
              class="btn-reject"
              @click="moderateComment(comment.id, 'REJECTED')"
            >
              拒绝
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="commentTotalPages > 1"
        class="pagination"
      >
        <button
          :disabled="commentPage <= 1"
          @click="
            commentPage--
            fetchComments()
          "
        >
          上一页
        </button>
        <span>{{ commentPage }} / {{ commentTotalPages }}</span>
        <button
          :disabled="commentPage >= commentTotalPages"
          @click="
            commentPage++
            fetchComments()
          "
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 举报处理 -->
    <div
      v-if="activeTab === 'reports'"
      class="tab-content"
    >
      <div class="filters">
        <select v-model="reportStatus">
          <option value="pending">待处理</option>
          <option value="resolved">已解决</option>
          <option value="dismissed">已驳回</option>
        </select>
      </div>

      <div
        v-if="loading"
        class="loading-state"
      >
        加载中...
      </div>

      <div
        v-else-if="reports.length === 0"
        class="empty-state"
      >
        暂无举报
      </div>

      <div
        v-else
        class="report-list"
      >
        <div
          v-for="report in reports"
          :key="report.id"
          class="report-card"
        >
          <div class="report-header">
            <div class="report-info">
              <span class="report-reason">{{ getReasonLabel(report.reason) }}</span>
              <span class="report-time">{{ formatTime(report.createdAt) }}</span>
            </div>
            <div class="report-reporter">举报人：{{ report.reporter.username }}</div>
          </div>

          <div
            v-if="report.description"
            class="report-description"
          >
            {{ report.description }}
          </div>

          <div
            v-if="report.comment"
            class="reported-content"
          >
            <div class="content-header">
              被举报评论（作者：{{ report.comment.author.username }}）
            </div>
            <div class="content-text">
              {{ report.comment.content }}
            </div>
            <div class="content-post">
              文章：<NuxtLink :to="`/posts/${report.comment.post.slug}`">
                {{ report.comment.post.title }}
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="report.status === 'pending'"
            class="report-actions"
          >
            <button
              class="btn-approve"
              @click="resolveReport(report.id, 'resolved', 'approve_comment')"
            >
              批准评论
            </button>
            <button
              class="btn-reject"
              @click="resolveReport(report.id, 'resolved', 'reject_comment')"
            >
              拒绝评论
            </button>
            <button
              class="btn-delete"
              @click="resolveReport(report.id, 'resolved', 'delete_comment')"
            >
              删除评论
            </button>
            <button
              class="btn-dismiss"
              @click="resolveReport(report.id, 'dismissed')"
            >
              驳回举报
            </button>
          </div>

          <div
            v-else
            class="report-resolved"
          >
            <span class="resolved-status">
              {{ report.status === 'resolved' ? '已解决' : '已驳回' }}
            </span>
            <span
              v-if="report.resolver"
              class="resolved-by"
            >
              处理人：{{ report.resolver.username }}
            </span>
            <span
              v-if="report.resolvedAt"
              class="resolved-time"
            >
              {{ formatTime(report.resolvedAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="reportTotalPages > 1"
        class="pagination"
      >
        <button
          :disabled="reportPage <= 1"
          @click="
            reportPage--
            fetchReports()
          "
        >
          上一页
        </button>
        <span>{{ reportPage }} / {{ reportTotalPages }}</span>
        <button
          :disabled="reportPage >= reportTotalPages"
          @click="
            reportPage++
            fetchReports()
          "
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.moderation-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.tabs button:hover {
  background: var(--bg-secondary);
}

.tabs button.active {
  background: var(--color-primary);
  color: white;
}

.filters {
  margin-bottom: 1.5rem;
}

.filters select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.comment-list,
.report-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-card,
.report-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
  color: var(--text-primary);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.report-count {
  color: var(--color-danger);
  font-weight: 500;
}

.comment-content {
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.comment-post {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.comment-post a {
  color: var(--color-primary);
  text-decoration: none;
}

.comment-post a:hover {
  text-decoration: underline;
}

.comment-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-approve {
  padding: 0.5rem 1rem;
  background: var(--color-success);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity var(--transition-fast);
}

.btn-approve:hover {
  opacity: 0.9;
}

.btn-reject {
  padding: 0.5rem 1rem;
  background: var(--color-warning);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity var(--transition-fast);
}

.btn-reject:hover {
  opacity: 0.9;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: var(--color-danger);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity var(--transition-fast);
}

.btn-delete:hover {
  opacity: 0.9;
}

.btn-dismiss {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background var(--transition-fast);
}

.btn-dismiss:hover {
  background: var(--bg-tertiary);
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.report-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-reason {
  font-weight: 600;
  color: var(--color-danger);
}

.report-time {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.report-reporter {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.report-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.reported-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
}

.content-header {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-bottom: 0.5rem;
}

.content-text {
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.content-post {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.content-post a {
  color: var(--color-primary);
  text-decoration: none;
}

.content-post a:hover {
  text-decoration: underline;
}

.report-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.report-resolved {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.resolved-status {
  font-weight: 500;
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
