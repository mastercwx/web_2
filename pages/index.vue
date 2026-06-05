<template>
  <div class="space-y-8">
    <div class="hero-section">
      <h1 class="hero-title">{{ $t('home.title') }}</h1>
      <p class="hero-subtitle">{{ $t('home.subtitle') }}</p>
    </div>
    <div class="max-w-6xl mx-auto">
      <RecommendationFeed
        :title="$t('recommendations.title')"
        :limit="12"
        show-reason
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: t('home.title'),
})
</script>

<style scoped>
.hero-section {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--bg-primary);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.hero-title {
  font-family: 'Averia Gruesa Libre', cursive;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
  letter-spacing: 0.02em;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
