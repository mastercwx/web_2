<script setup lang="ts">
const authStore = useAuthStore()

const sidebarItems = [
  { label: '仪表盘', icon: '📊', to: '/admin' },
  { label: '用户管理', icon: '👥', to: '/admin/users' },
  { label: '文章管理', icon: '📝', to: '/admin/posts' },
  { label: '媒体库', icon: '🖼️', to: '/admin/media' },
  { label: '联系消息', icon: '✉️', to: '/admin/contacts' },
  { label: '内容审核', icon: '🛡️', to: '/admin/moderation' },
  { label: '活动日志', icon: '📋', to: '/admin/activity' },
  { label: 'A/B 测试', icon: '🧪', to: '/admin/experiments' },
  { label: 'Webhooks', icon: '🔗', to: '/admin/webhooks' },
  { label: '数据导出', icon: '📤', to: '/admin/export' },
  { label: '系统设置', icon: '⚙️', to: '/admin/settings' },
]
</script>

<template>
  <div class="min-h-screen admin-layout">
    <!-- 顶部导航 -->
    <header class="admin-header">
      <div class="flex items-center justify-between px-6 py-3">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/admin"
            class="text-xl font-bold text-primary"
          >
            HG Web 管理后台
          </NuxtLink>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-secondary">
            {{ authStore.username }}
          </span>
          <ThemeSwitcher />
          <NuxtLink
            to="/"
            class="text-sm text-secondary hover:text-primary"
          >
            返回前台
          </NuxtLink>
          <button
            class="text-sm text-secondary hover:text-primary"
            @click="authStore.logout()"
          >
            退出
          </button>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar">
        <nav class="p-4 space-y-2">
          <NuxtLink
            v-for="item in sidebarItems"
            :key="item.to"
            :to="item.to"
            class="sidebar-link"
            active-class="sidebar-link-active"
          >
            <span>{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- 主内容 -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  background: var(--bg-secondary);
}

.admin-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.admin-sidebar {
  width: 16rem;
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  min-height: calc(100vh - 57px);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.sidebar-link:hover {
  background: var(--bg-tertiary);
}

.sidebar-link-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
</style>
