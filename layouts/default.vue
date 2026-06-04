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

          <!-- 搜索 -->
          <div class="search-wrapper">
            <button
              class="search-toggle"
              :title="t('nav.search')"
              @click="toggleSearch"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
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

          <!-- 主题切换 -->
          <ThemeSwitcher />

          <!-- 语言切换 -->
          <LanguageSwitcher />

          <!-- 用户状态 -->
          <template v-if="authStore.isAuthenticated">
            <NuxtLink
              :to="`/users/${authStore.user?.id}`"
              class="nav-link"
            >
              {{ $t('nav.profile') }}
            </NuxtLink>
            <NuxtLink
              :to="`/users/${authStore.user?.id}/settings`"
              class="nav-link"
            >
              {{ $t('nav.settings') }}
            </NuxtLink>
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
const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const currentYear = new Date().getFullYear()

const showSearch = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

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
})
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

.search-wrapper {
  position: relative;
}

.search-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.search-toggle:hover {
  color: var(--color-primary);
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
  min-width: 300px;
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
}

.search-btn:hover {
  background: var(--color-primary-hover);
}
</style>
