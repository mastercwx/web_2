<template>
  <div class="chart-container">
    <div
      ref="chartRef"
      class="chart"
    />
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'

interface PieData {
  name: string
  value: number
}

interface Props {
  title: string
  data: PieData[]
  colors?: string[]
  showLegend?: boolean
  roseType?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  showLegend: true,
  roseType: false,
})

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)

  const option: echarts.EChartsOption = {
    title: {
      text: props.title,
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
        color: '#374151',
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#374151',
      },
      formatter: '{b}: {c} ({d}%)',
    },
    ...(props.showLegend
      ? {
          legend: {
            orient: 'vertical' as const,
            right: '5%',
            top: 'center',
            textStyle: {
              color: '#6b7280',
            },
          },
        }
      : {}),
    series: [
      {
        type: 'pie',
        radius: props.roseType ? ['40%', '70%'] : ['50%', '70%'],
        center: props.showLegend ? ['40%', '50%'] : ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: props.data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: props.colors[index % props.colors.length] || '#6366f1',
          },
        })),
        ...(props.roseType ? { roseType: 'radius' as const } : {}),
      },
    ],
  }

  chart.setOption(option)
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(
  () => props.data,
  () => {
    if (chart) {
      chart.setOption({
        series: [
          {
            data: props.data.map((item, index) => ({
              ...item,
              itemStyle: {
                color: props.colors[index % props.colors.length] || '#6366f1',
              },
            })),
          },
        ],
      })
    }
  },
  { deep: true },
)
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
