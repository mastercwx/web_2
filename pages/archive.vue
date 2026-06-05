<template>
  <div class="archive-page">
    <div class="archive-header">
      <h1>{{ t('archive.title') }}</h1>
      <p class="archive-description">
        {{ t('archive.description', { count: totalPosts }) }}
      </p>
    </div>

    <div class="archive-content">
      <!-- 年份筛选 -->
      <div
        v-if="yearCounts.length > 1"
        class="year-filter"
      >
        <button
          class="year-btn"
          :class="{ active: !selectedYear }"
          @click="selectedYear = undefined"
        >
          {{ t('archive.allYears') }}
        </button>
        <button
          v-for="yc in yearCounts"
          :key="yc.year"
          class="year-btn"
          :class="{ active: selectedYear === Number(yc.year) }"
          @click="selectedYear = Number(yc.year)"
        >
          {{ yc.year }} ({{ yc.count }})
        </button>
      </div>

      <div
        v-if="loading"
        class="loading"
      >
        {{ t('common.loading') }}
      </div>

      <div
        v-else-if="Object.keys(filteredArchives).length === 0"
        class="no-posts"
      >
        {{ t('archive.noPosts') }}
      </div>

      <div
        v-else
        class="timeline"
      >
        <div
          v-for="year in filteredYears"
          :key="year"
          class="timeline-year"
        >
          <h2 class="year-title">
            {{ year }}
          </h2>

          <div
            v-for="month in Object.keys(filteredArchives[year] || {}).sort(
              (a, b) => Number(b) - Number(a),
            )"
            :key="`${year}-${month}`"
            class="timeline-month"
          >
            <h3 class="month-title">
              {{ getMonthName(month) }}
            </h3>

            <ul class="posts-list">
              <li
                v-for="post in filteredArchives[year]?.[month]"
                :key="post.id"
                class="post-item"
              >
                <span class="post-date">{{ getDay(post.createdAt) }}</span>
                <NuxtLink
                  :to="`/posts/${post.slug}`"
                  class="post-link"
                >
                  {{ post.title }}
                </NuxtLink>
                <div
                  v-if="post.tags.length > 0"
                  class="post-tags"
                >
                  <NuxtLink
                    v-for="tag in post.tags"
                    :key="tag.id"
                    :to="`/tags/${tag.name}`"
                    class="tag"
                  >
                    {{ tag.name }}
                  </NuxtLink>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

interface Post {
  id: number
  title: string
  slug: string
  createdAt: string
  author: {
    id: number
    username: string
    avatar: string | null
  }
  tags: Array<{
    id: number
    name: string
  }>
}

type Archives = Record<string, Record<string, Post[]>>

const archives = ref<Archives>({})
const years = ref<string[]>([])
const yearCounts = ref<Array<{ year: string; count: number }>>([])
const totalPosts = ref(0)
const loading = ref(true)
const selectedYear = ref<number | undefined>(undefined)

const filteredYears = computed(() => {
  if (!selectedYear.value) return years.value
  return years.value.filter((y) => Number(y) === selectedYear.value)
})

const filteredArchives = computed(() => {
  if (!selectedYear.value) return archives.value
  const result: Archives = {}
  const yearStr = selectedYear.value.toString()
  if (archives.value[yearStr]) {
    result[yearStr] = archives.value[yearStr]
  }
  return result
})

const fetchArchive = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/posts/archive', {
      params: selectedYear.value ? { year: selectedYear.value } : {},
    })
    archives.value = data.data.archives
    years.value = data.data.years
    yearCounts.value = data.data.yearCounts
    totalPosts.value = data.data.totalPosts
  } catch (error) {
    console.error('Failed to fetch archive:', error)
  } finally {
    loading.value = false
  }
}

const getMonthName = (month: string) => {
  const months = [
    t('archive.months.jan'),
    t('archive.months.feb'),
    t('archive.months.mar'),
    t('archive.months.apr'),
    t('archive.months.may'),
    t('archive.months.jun'),
    t('archive.months.jul'),
    t('archive.months.aug'),
    t('archive.months.sep'),
    t('archive.months.oct'),
    t('archive.months.nov'),
    t('archive.months.dec'),
  ]
  return months[Number(month) - 1]
}

const getDay = (dateString: string) => {
  const date = new Date(dateString)
  return date.getDate().toString().padStart(2, '0')
}

onMounted(() => {
  fetchArchive()
})

watch(selectedYear, () => {
  fetchArchive()
})
</script>

<style scoped>
.archive-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.archive-header {
  text-align: center;
  margin-bottom: 3rem;
}

.archive-header h1 {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.archive-description {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.year-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.year-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.year-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.year-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.no-posts {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.timeline {
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.timeline-year {
  margin-bottom: 3rem;
}

.year-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  padding-left: 50px;
  position: relative;
}

.year-title::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  background: var(--primary-color);
  border-radius: 50%;
  border: 3px solid var(--bg-primary);
}

.timeline-month {
  margin-bottom: 2rem;
  padding-left: 50px;
}

.month-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  position: relative;
}

.month-title::before {
  content: '';
  position: absolute;
  left: -38px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: var(--bg-secondary);
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.post-item:last-child {
  border-bottom: none;
}

.post-date {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.post-link {
  flex: 1;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}

.post-link:hover {
  color: var(--primary-color);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  padding: 0.15rem 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 12px;
  font-size: 0.7rem;
  text-decoration: none;
  transition: all 0.2s;
}

.tag:hover {
  background: var(--primary-color);
  color: white;
}

@media (max-width: 768px) {
  .archive-header h1 {
    font-size: 2rem;
  }

  .timeline::before {
    left: 10px;
  }

  .year-title {
    font-size: 1.5rem;
    padding-left: 35px;
  }

  .year-title::before {
    left: 2px;
    width: 16px;
    height: 16px;
  }

  .timeline-month {
    padding-left: 35px;
  }

  .month-title::before {
    left: -28px;
    width: 10px;
    height: 10px;
  }

  .post-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .post-tags {
    margin-top: 0.25rem;
  }
}
</style>
