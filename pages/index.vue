<template>
  <div class="space-y-6">
    <div class="text-center py-12">
      <h1 class="text-4xl font-bold text-primary mb-4">
        {{ $t('home.title') }}
      </h1>
      <p class="text-lg text-secondary max-w-2xl mx-auto">
        {{ $t('home.subtitle') }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <FeatureCard
        :title="$t('home.features.nuxt.title')"
        :description="$t('home.features.nuxt.description')"
        icon="⚡"
      />
      <FeatureCard
        :title="$t('home.features.typescript.title')"
        :description="$t('home.features.typescript.description')"
        icon="🔒"
      />
      <FeatureCard
        :title="$t('home.features.tailwind.title')"
        :description="$t('home.features.tailwind.description')"
        icon="🎨"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => `${t('nav.home')} - ${t('common.appName')}`,
})
</script>
