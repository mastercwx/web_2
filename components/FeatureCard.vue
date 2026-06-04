<template>
  <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
    <div class="text-3xl mb-4">
      {{ icon }}
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      {{ title }}
    </h3>
    <p class="text-gray-600">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  icon: '📦',
})
</script>
