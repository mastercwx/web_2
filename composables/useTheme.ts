export function useTheme() {
  const themeStore = useThemeStore()

  return {
    theme: computed(() => themeStore.theme),
    isDark: computed(() => themeStore.isDark),
    setTheme: themeStore.setTheme.bind(themeStore),
    toggleTheme: themeStore.toggleTheme.bind(themeStore),
  }
}
