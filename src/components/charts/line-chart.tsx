'use client'

import ReactECharts from 'echarts-for-react'

interface LineChartProps {
  data: { label: string; value: number }[]
  title: string
  color?: string
  area?: boolean
}

export function LineChart({ data, title, color = '#f97316', area = true }: LineChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: !area,
      data: data.map(d => d.label),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10
      }
    },
    series: [
      {
        name: title,
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: color
        },
        itemStyle: {
          color: color
        },
        areaStyle: area ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '80' },
              { offset: 1, color: color + '10' }
            ]
          }
        } : undefined,
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <ReactECharts 
        option={option} 
        style={{ height: '280px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}
