'use client'

import ReactECharts from 'echarts-for-react'

interface PieChartProps {
  data: { label: string; value: number }[]
  title: string
  colors?: string[]
}

const DEFAULT_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']

export function PieChart({ data, title, colors = DEFAULT_COLORS }: PieChartProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        fontSize: 11
      }
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.label,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }))
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
