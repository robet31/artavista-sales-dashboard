'use client'

import ReactECharts from 'echarts-for-react'

interface BarChartProps {
  data: { label: string; value: number }[]
  title: string
  color?: string
  horizontal?: boolean
}

export function BarChart({ data, title, color = '#f97316', horizontal = false }: BarChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : data.map(d => d.label),
      axisLabel: {
        rotate: horizontal ? 0 : 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? data.map(d => d.label) : undefined,
      axisLabel: {
        fontSize: 10
      }
    },
    series: [
      {
        name: title,
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: {
          color: color,
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '60%',
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(180, 180, 180, 0.2)'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
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
