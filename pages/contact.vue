<template>
  <div class="contact-page">
    <div class="contact-header">
      <h1>联系我们</h1>
      <p>有任何问题或建议？欢迎随时联系我们</p>
    </div>

    <div class="contact-content">
      <div class="contact-info">
        <div class="info-card">
          <div class="info-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div class="info-content">
            <h3>电子邮件</h3>
            <p>contact@example.com</p>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="info-content">
            <h3>工作时间</h3>
            <p>周一至周五 9:00 - 18:00</p>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle
                cx="12"
                cy="10"
                r="3"
              />
            </svg>
          </div>
          <div class="info-content">
            <h3>地址</h3>
            <p>中国 · 互联网</p>
          </div>
        </div>
      </div>

      <form
        class="contact-form"
        @submit.prevent="handleSubmit"
      >
        <h2>发送消息</h2>

        <div
          v-if="success"
          class="alert alert-success"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {{ successMessage }}
        </div>

        <div
          v-if="error"
          class="alert alert-error"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <line
              x1="15"
              y1="9"
              x2="9"
              y2="15"
            />
            <line
              x1="9"
              y1="9"
              x2="15"
              y2="15"
            />
          </svg>
          {{ error }}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="name">姓名 <span class="required">*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="请输入您的姓名"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">邮箱 <span class="required">*</span></label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="请输入您的邮箱"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="subject">主题</label>
          <input
            id="subject"
            v-model="form.subject"
            type="text"
            placeholder="请输入消息主题（可选）"
          />
        </div>

        <div class="form-group">
          <label for="content">内容 <span class="required">*</span></label>
          <textarea
            id="content"
            v-model="form.content"
            rows="6"
            placeholder="请输入您想说的话..."
            required
          />
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="submitting"
        >
          <span
            v-if="submitting"
            class="loading-spinner"
          />
          {{ submitting ? '发送中...' : '发送消息' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面 SEO
useSeo({
  title: '联系我们',
  description: '有任何问题或建议？欢迎随时联系我们',
})

const form = reactive({
  name: '',
  email: '',
  subject: '',
  content: '',
})

const submitting = ref(false)
const success = ref(false)
const error = ref('')
const successMessage = ref('')

async function handleSubmit() {
  error.value = ''
  success.value = false
  submitting.value = true

  try {
    const result = await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        subject: form.subject,
        content: form.content,
      },
    })

    success.value = true
    successMessage.value = result.message || '消息已发送，我们会尽快回复您'

    // 重置表单
    form.name = ''
    form.email = ''
    form.subject = ''
    form.content = ''
  } catch (e: any) {
    error.value = e.data?.message || '发送失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.contact-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.contact-header {
  text-align: center;
  margin-bottom: 3rem;
}

.contact-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.contact-header p {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
}

/* 联系信息 */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.info-icon {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon svg {
  width: 24px;
  height: 24px;
}

.info-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.info-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 联系表单 */
.contact-form {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
}

.contact-form h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.required {
  color: #ef4444;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 提示框 */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .contact-page {
    padding: 1rem;
  }

  .contact-header h1 {
    font-size: 2rem;
  }

  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
