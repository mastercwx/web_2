<template>
  <NuxtLink
    :to="`/posts/${post.slug}`"
    class="post-card"
  >
    <div class="card-image">
      <img
        v-if="post.coverImage"
        :src="post.coverImage"
        :alt="post.title"
      />
      <div
        v-else
        class="image-placeholder"
      >
        <span>{{ post.title[0] }}</span>
      </div>
      <div
        v-if="showReason && post.reason"
        class="card-badge"
      >
        {{ post.reason }}
      </div>
    </div>

    <div class="card-content">
      <div
        v-if="post.tags.length > 0"
        class="card-tags"
      >
        <span
          v-for="tag in post.tags.slice(0, 3)"
          :key="tag.id"
          class="tag"
        >
          {{ tag.name }}
        </span>
      </div>

      <h3 class="card-title">{{ post.title }}</h3>

      <p
        v-if="post.excerpt"
        class="card-excerpt"
      >
        {{ post.excerpt }}
      </p>

      <div class="card-footer">
        <div class="author-info">
          <img
            v-if="post.author.avatar"
            :src="post.author.avatar"
            :alt="post.author.username"
            class="author-avatar"
          />
          <div
            v-else
            class="avatar-placeholder"
          >
            {{ post.author.username[0] }}
          </div>
          <span class="author-name">{{ post.author.username }}</span>
        </div>
        <span class="post-date">{{ formatDate(post.createdAt) }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  author: {
    id: number
    username: string
    avatar: string | null
  }
  tags: { id: number; name: string }[]
  score: number
  reason: string
  createdAt: string
}

interface Props {
  post: Post
  showReason?: boolean
}

withDefaults(defineProps<Props>(), {
  showReason: false,
})

function formatDate(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days} 天前`
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} 周前`
  } else {
    return d.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }
}
</script>

<style scoped>
.post-card {
  display: block;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: all 0.35s ease;
  box-shadow: var(--shadow-sm);
}

.post-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(47, 203, 231, 0.3);
}

.card-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.post-card:hover .card-image img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 3rem;
}

.card-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: var(--color-brand);
  color: #5b423f;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.card-content {
  padding: 1.25rem;
}

.card-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.2rem 0.6rem;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-excerpt {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.post-date {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
</style>
