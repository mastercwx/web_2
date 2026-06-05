<template>
  <div class="min-h-screen flex flex-col">
    <!-- 背景装饰 -->
    <div class="bg-decoration" />

    <!-- 透明浮动导航 -->
    <header class="floating-header">
      <nav class="nav-container">
        <div class="nav-inner">
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
      </nav>

      <!-- 移动端菜单 -->
      <Transition name="menu-fade">
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
      </Transition>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <footer class="floating-footer">
      <div class="footer-inner">&copy; {{ currentYear }} {{ $t('common.appName') }}.</div>
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
/* 背景装饰 */
.bg-decoration {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: var(--bg-base);
  pointer-events: none;
}

.bg-decoration::before {
  content: '';
  position: absolute;
  top: -20%;
  right: -10%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 203, 231, 0.15) 0%, transparent 70%);
  filter: blur(60px);
}

.bg-decoration::after {
  content: '';
  position: absolute;
  bottom: -15%;
  left: -5%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(238, 194, 94, 0.12) 0%, transparent 70%);
  filter: blur(60px);
}

/* 浮动导航 */
.floating-header {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2rem);
  max-width: 1200px;
  z-index: 100;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.nav-container {
  padding: 0.5rem 1.5rem;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-family: 'Averia Gruesa Libre', cursive;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  flex-shrink: 0;
  letter-spacing: 0.02em;
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
  font-size: 0.875rem;
}

.nav-link:hover {
  color: var(--color-brand);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  color: var(--color-brand);
  background: var(--bg-tertiary);
}

.icon {
  width: 18px;
  height: 18px;
}

/* 搜索框 */
.search-wrapper {
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  padding: 0.75rem;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  gap: 0.5rem;
  z-index: 50;
  min-width: 280px;
}

@media (max-width: 480px) {
  .search-dropdown {
    position: fixed;
    top: 72px;
    left: 1rem;
    right: 1rem;
    min-width: auto;
  }
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-brand);
}

.search-btn {
  padding: 0.5rem 1rem;
  background: var(--color-brand);
  color: #5b423f;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.search-btn:hover {
  filter: brightness(1.1);
}

/* 汉堡菜单 */
.hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
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
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.25s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-link {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: 0.9rem;
}

.mobile-link:hover {
  color: var(--color-brand);
  background: var(--bg-tertiary);
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
  padding: 0.625rem 0.75rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.mobile-logout {
  color: var(--color-danger);
}

.mobile-logout:hover {
  background: rgba(239, 68, 68, 0.08);
}

.mobile-register {
  color: var(--color-brand);
  font-weight: 500;
}

/* 主内容区 */
.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 6rem 1.5rem 3rem;
  position: relative;
  z-index: 1;
}

@media (max-width: 1023px) {
  .main-content {
    padding-top: 5rem;
  }
}

/* 浮动底部 */
.floating-footer {
  position: relative;
  z-index: 1;
  padding: 1.5rem;
  text-align: center;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-tertiary);
  font-size: 0.8rem;
}
</style>
