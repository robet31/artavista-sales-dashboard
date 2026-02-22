'use client'

import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

function formatNumber(num: number, isCurrency: boolean = false): string {
  if (isCurrency) {
    if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)} M`
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)} JT`
    if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)} RB`
    return `Rp ${num.toFixed(0)}`
  }
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)} M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)} RB`
  return num.toLocaleString('id-ID')
}

interface EChartProps {
  options: echarts.EChartsOption
  height?: number
}

export function EChartBase({ options, height = 300 }: EChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)
    
    return () => {
      chartInstance.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !options) return
    
    chartInstance.current.setOption(options, true)
    
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [options])

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
}

interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  isCurrency?: boolean
  height?: number
  showLabels?: boolean
}

export function EBarChart({ data, color = CHART_COLORS[0], isCurrency = false, height = 300, showLabels = true }: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    return () => chartInstance.current?.dispose()
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !data.length) return

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const val = params[0]
          const total = data.reduce((sum, item) => sum + item.value, 0)
          const percent = ((val.value / total) * 100).toFixed(1)
          return `<div style="font-weight:600">${val.name}</div><div>${formatNumber(val.value, isCurrency)}</div><div style="color:#64748b;font-size:11px">${percent}% dari total</div>`
        }
      },
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: -5,
        itemGap: 12,
        textStyle: { color: '#64748b', fontSize: 10 },
        formatter: (name: string) => {
          const item = data.find(d => d.label === name)
          return name.length > 10 ? name.substring(0, 10) + '...' : name
        }
      },
      grid: { left: 50, right: 20, top: 20, bottom: 60 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label),
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          rotate: data.length > 6 ? 35 : 0,
          formatter: (value: string) => {
            if (value.includes('-')) {
              const [year, month] = value.split('-')
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              return `${months[parseInt(month) - 1]} ${year.slice(2)}`
            }
            return value.length > 8 && data.length > 6 ? value.substring(0, 6) + '...' : value
          }
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: number) => formatNumber(value, isCurrency)
        },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }
      },
      series: [{
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: { color, borderRadius: [6, 6, 0, 0] },
        barMaxWidth: 40,
        label: showLabels ? {
          show: true,
          position: 'top',
          formatter: (params: any) => formatNumber(params.value, isCurrency),
          color: '#475569',
          fontSize: 10,
          fontWeight: 600
        } : { show: false }
      }],
      animationDuration: 800,
      animationEasing: 'cubicOut'
    }

    chartInstance.current.setOption(option, true)
    
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [data, color, isCurrency, showLabels])

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
}

interface LineChartProps {
  data: { label: string; value: number }[]
  color?: string
  isCurrency?: boolean
  height?: number
  showArea?: boolean
}

export function ELineChart({ data, color = CHART_COLORS[0], isCurrency = false, height = 300, showArea = true }: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    return () => chartInstance.current?.dispose()
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !data.length) return

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const val = params[0]
          return `<div style="font-weight:600">${val.name}</div><div>${formatNumber(val.value, isCurrency)}</div>`
        }
      },
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: -5,
        itemGap: 12,
        textStyle: { color: '#64748b', fontSize: 10 }
      },
      grid: { left: 50, right: 20, top: 20, bottom: 60 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label),
        boundaryGap: false,
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          rotate: data.length > 6 ? 35 : 0,
          formatter: (value: string) => {
            if (value.includes('-')) {
              const [year, month] = value.split('-')
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              return `${months[parseInt(month) - 1]} ${year.slice(2)}`
            }
            return value.length > 8 && data.length > 6 ? value.substring(0, 6) + '...' : value
          }
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: number) => formatNumber(value, isCurrency)
        },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }
      },
      series: [
        {
          type: 'line',
          data: data.map(d => d.value),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color },
          lineStyle: { width: 3 },
          areaStyle: showArea ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' }
            ])
          } : undefined,
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => formatNumber(params.value, isCurrency),
            color: '#475569',
            fontSize: 10,
            fontWeight: 600
          }
        }
      ],
      animationDuration: 1500,
      animationEasing: 'cubicOut'
    }

    chartInstance.current.setOption(option, true)
    
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [data, color, isCurrency, showArea])

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
}

interface PieChartProps {
  data: { label: string; value: number }[]
  colors?: string[]
  height?: number
  isCurrency?: boolean
}

export function EPieChart({ data, colors = CHART_COLORS, height = 300, isCurrency = false }: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    return () => chartInstance.current?.dispose()
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !data.length) return

    const total = data.reduce((sum, item) => sum + item.value, 0)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const percent = ((params.value / total) * 100).toFixed(1)
          return `<div style="font-weight:600">${params.name}</div><div>${formatNumber(params.value, isCurrency)}</div><div style="color:#64748b;font-size:11px">${percent}%</div>`
        }
      },
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: -5,
        itemGap: 8,
        textStyle: { color: '#64748b', fontSize: 10 },
        formatter: (name: string) => {
          const item = data.find(d => d.label === name)
          const val = item ? formatNumber(item.value, isCurrency) : ''
          return name.length > 12 ? name.substring(0, 12) + '...' : name + ' (' + val + ')'
        }
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.3)' }
        },
        labelLine: { show: false },
        data: data.map((d, i) => ({
          name: d.label,
          value: d.value,
          itemStyle: { color: colors[i % colors.length] }
        }))
      }],
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    }

    chartInstance.current.setOption(option, true)
    
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [data, colors, isCurrency])

  return (
    <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
  )
}
