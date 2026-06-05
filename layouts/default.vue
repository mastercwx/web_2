<template>
  <div class="min-h-screen flex flex-col">
    <header class="header">
      <nav class="container mx-auto px-4 py-3">
        <div class="nav-main">
          <!-- Logo -->
          <NuxtLink
            to="/"
            class="logo"
          >
            {{ $t('common.appName') }}
          </NuxtLink>

          <!-- 桌面端导航 -->
          <div class="nav-links-desktop">
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
              to="/tags"
              class="nav-link"
            >
              {{ $t('nav.tags') }}
            </NuxtLink>
            <NuxtLink
              to="/archive"
              class="nav-link"
            >
              {{ $t('nav.archive') }}
            </NuxtLink>
            <NuxtLink
              to="/series"
              class="nav-link"
            >
              {{ $t('nav.series') }}
            </NuxtLink>
            <NuxtLink
              to="/about"
              class="nav-link"
            >
              {{ $t('nav.about') }}
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="nav-link"
            >
              {{ $t('nav.contact') }}
            </NuxtLink>
          </div>

          <!-- 右侧操作区 -->
          <div class="nav-actions">
            <!-- 搜索 -->
            <div class="search-wrapper">
              <button
                class="icon-btn"
                :title="t('nav.search')"
                @click="toggleSearch"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              <div
                v-if="showSearch"
                class="search-dropdown"
              >
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  :placeholder="t('search.placeholder')"
                  class="search-input"
                  @keyup.enter="goToSearch"
                />
                <button
                  class="search-btn"
                  @click="goToSearch"
                >
                  {{ t('search.button') }}
                </button>
              </div>
            </div>

            <!-- 通知 -->
            <NotificationBell />

            <!-- 主题切换 -->
            <ThemeSwitcher />

            <!-- 语言切换 -->
            <LanguageSwitcher />

            <!-- 汉堡菜单按钮 (移动端) -->
            <button
              class="hamburger"
              @click="toggleMobileMenu"
            >
              <svg
                v-if="!showMobileMenu"
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                v-else
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- 移动端菜单 -->
        <div
          v-if="showMobileMenu"
          class="mobile-menu"
        >
          <NuxtLink
            to="/"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            to="/posts"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.posts') }}
          </NuxtLink>
          <NuxtLink
            to="/tags"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.tags') }}
          </NuxtLink>
          <NuxtLink
            to="/archive"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.archive') }}
          </NuxtLink>
          <NuxtLink
            to="/series"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.series') }}
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.about') }}
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="mobile-link"
            @click="closeMobileMenu"
          >
            {{ $t('nav.contact') }}
          </NuxtLink>

          <div class="mobile-divider" />

          <template v-if="authStore.isAuthenticated">
            <NuxtLink
              to="/dashboard"
              class="mobile-link"
              @click="closeMobileMenu"
            >
              {{ $t('nav.dashboard') }}
            </NuxtLink>
            <NuxtLink
              :to="`/users/${authStore.user?.id}`"
              class="mobile-link"
              @click="closeMobileMenu"
            >
              {{ $t('nav.profile') }}
            </NuxtLink>
            <NuxtLink
              :to="`/users/${authStore.user?.id}/settings`"
              class="mobile-link"
              @click="closeMobileMenu"
            >
              {{ $t('nav.settings') }}
            </NuxtLink>
            <div class="mobile-user-info">
              <span>{{ authStore.username }}</span>
            </div>
            <button
              class="mobile-link mobile-logout"
              @click="handleLogout"
            >
              {{ $t('nav.logout') }}
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="mobile-link"
              @click="closeMobileMenu"
            >
              {{ $t('nav.login') }}
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="mobile-link mobile-register"
              @click="closeMobileMenu"
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

    <!-- PWA 安装提示 -->
    <PwaInstallPrompt />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const currentYear = new Date().getFullYear()

const showSearch = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const showMobileMenu = ref(false)

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const goToSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() },
    })
    showSearch.value = false
    searchQuery.value = ''
  }
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // 防止背景滚动
  document.body.style.overflow = showMobileMenu.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  document.body.style.overflow = ''
}

const handleLogout = () => {
  closeMobileMenu()
  authStore.logout()
}

// 点击外部关闭搜索框
const closeSearch = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.search-wrapper')) {
    showSearch.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeSearch)
})

onUnmounted(() => {
  document.removeEventListener('click', closeSearch)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1rem 0;
}

.nav-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.nav-links-desktop {
  display: none;
  align-items: center;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .nav-links-desktop {
    display: flex;
  }
}

.nav-link {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 500;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  color: var(--color-primary);
  background: var(--bg-secondary);
}

.icon {
  width: 20px;
  height: 20px;
}

/* 搜索框 */
.search-wrapper {
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  gap: 0.5rem;
  z-index: 50;
  min-width: 260px;
}

@media (max-width: 480px) {
  .search-dropdown {
    position: fixed;
    top: 60px;
    left: 1rem;
    right: 1rem;
    min-width: auto;
  }
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background var(--transition-fast);
  white-space: nowrap;
}

.search-btn:hover {
  background: var(--color-primary-hover);
}

/* 汉堡菜单 */
.hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-primary);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

@media (max-width: 1023px) {
  .hamburger {
    display: flex;
  }
}

/* 移动端菜单 */
.mobile-menu {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
  margin-top: 0.75rem;
}

.mobile-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.mobile-link:hover {
  color: var(--color-primary);
  background: var(--bg-secondary);
}

.mobile-link.router-link-active {
  color: var(--color-primary);
  font-weight: 500;
}

.mobile-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.mobile-user-info {
  padding: 0.75rem 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.mobile-logout {
  color: #ef4444;
}

.mobile-logout:hover {
  background: #fef2f2;
}

.mobile-register {
  color: var(--color-primary);
  font-weight: 500;
}
</style>
