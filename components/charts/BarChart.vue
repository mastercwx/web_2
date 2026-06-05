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

interface Props {
  title: string
  xData: string[]
  yData: number[]
  color?: string
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: '#6366f1',
  horizontal: false,
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
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#374151',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: props.horizontal
      ? {
          type: 'value' as const,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
        }
      : {
          type: 'category' as const,
          data: props.xData,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
        },
    yAxis: props.horizontal
      ? {
          type: 'category' as const,
          data: props.xData,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        }
      : {
          type: 'value' as const,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
    series: [
      {
        data: props.yData,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(
            props.horizontal ? 0 : 0,
            props.horizontal ? 0 : 1,
            props.horizontal ? 1 : 0,
            props.horizontal ? 0 : 0,
            [
              { offset: 0, color: `${props.color}66` },
              { offset: 1, color: props.color },
            ],
          ),
          borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
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
  () => [props.xData, props.yData],
  () => {
    if (chart) {
      chart.setOption({
        xAxis: props.horizontal ? {} : { data: props.xData },
        yAxis: props.horizontal ? { data: props.xData } : {},
        series: [{ data: props.yData }],
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
