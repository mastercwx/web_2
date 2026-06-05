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
  smooth?: boolean
  areaStyle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: '#6366f1',
  smooth: true,
  areaStyle: true,
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
    xAxis: {
      type: 'category',
      data: props.xData,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
        },
      },
    },
    series: [
      {
        data: props.yData,
        type: 'line',
        smooth: props.smooth,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: props.color,
          width: 2,
        },
        itemStyle: {
          color: props.color,
        },
        areaStyle: props.areaStyle
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `${props.color}33` },
                { offset: 1, color: `${props.color}0a` },
              ]),
            }
          : undefined,
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
        xAxis: { data: props.xData },
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
