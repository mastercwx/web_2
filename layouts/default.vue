<template>
  <div class="min-h-screen flex flex-col">
    <header class="header">
      <nav class="container mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="text-xl font-bold text-primary"
        >
          {{ $t('common.appName') }}
        </NuxtLink>

        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="nav-link"
          >
            {{ $t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            to="/posts"
            class="nav-link"
          >
            {{ $t('nav.posts') }}
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="nav-link"
          >
            {{ $t('nav.about') }}
          </NuxtLink>

          <!-- 主题切换 -->
          <ThemeSwitcher />

          <!-- 语言切换 -->
          <LanguageSwitcher />

          <!-- 用户状态 -->
          <template v-if="authStore.isAuthenticated">
            <span class="text-sm text-secondary">
              {{ $t('nav.welcome') }}，{{ authStore.username }}
            </span>
            <button
              class="text-sm text-secondary hover:text-primary"
              @click="authStore.logout()"
            >
              {{ $t('nav.logout') }}
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="nav-link"
            >
              {{ $t('nav.login') }}
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="btn-primary"
            >
              {{ $t('nav.register') }}
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
      <slot />
    </main>

    <footer class="footer">
      <div class="container mx-auto px-4 text-center text-secondary text-sm">
        &copy; {{ currentYear }} {{ $t('common.appName') }}. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1rem 0;
}

.nav-link {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 500;
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
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}
</style>
