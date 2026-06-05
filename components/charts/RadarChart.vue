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

interface RadarData {
  name: string
  value: number
}

interface RadarIndicator {
  name: string
  max: number
}

interface Props {
  title: string
  indicators: RadarIndicator[]
  data: RadarData[]
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#6366f1',
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
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#374151',
      },
    },
    radar: {
      indicator: props.indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#6b7280',
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#f9fafb', '#f3f4f6'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: props.data.map((item) => item.value),
            name: props.data[0]?.name || '数据',
            areaStyle: {
              color: `${props.color}33`,
            },
            lineStyle: {
              color: props.color,
              width: 2,
            },
            itemStyle: {
              color: props.color,
            },
            symbol: 'circle',
            symbolSize: 6,
          },
        ],
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
            data: [
              {
                value: props.data.map((item) => item.value),
                name: props.data[0]?.name || '数据',
              },
            ],
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
