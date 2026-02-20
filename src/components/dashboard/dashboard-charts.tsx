'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrdersLineChart, PizzaSizeChart, DeliveryPieChart, TrafficBarChart, RevenueChart } from '@/components/dashboard/charts'

interface DashboardChartsProps {
  userRole?: string
}

export function DashboardCharts({ userRole }: DashboardChartsProps) {
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [])

  const fetchChartData = async () => {
    try {
      const res = await fetch('/api/dashboard/charts')
      if (res.ok) {
        const data = await res.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const ordersByMonth = chartData?.ordersByMonth?.length > 0 ? chartData.ordersByMonth : [
    { month: 'Jan', count: 120 }, { month: 'Feb', count: 190 }, { month: 'Mar', count: 150 },
    { month: 'Apr', count: 220 }, { month: 'May', count: 280 }, { month: 'Jun', count: 320 }
  ]

  const pizzaSizes = chartData?.pizzaSizes?.length > 0 ? chartData.pizzaSizes : [
    { size: 'Small', count: 150 }, { size: 'Medium', count: 450 }, { size: 'Large', count: 320 }, { size: 'XL', count: 180 }
  ]

  const onTimeData = chartData?.onTime || 75
  const delayedData = chartData?.delayed || 25

  const trafficByHour = chartData?.trafficByHour?.length > 0 ? chartData.trafficByHour : [
    { hour: '08:00', count: 25 }, { hour: '10:00', count: 45 }, { hour: '12:00', count: 120 },
    { hour: '14:00', count: 85 }, { hour: '16:00', count: 65 }, { hour: '18:00', count: 180 },
    { hour: '20:00', count: 220 }, { hour: '22:00', count: 95 }
  ]

  const revenueData = [
    { label: 'Mon', value: 1200 }, { label: 'Tue', value: 1800 }, { label: 'Wed', value: 1400 },
    { label: 'Thu', value: 2100 }, { label: 'Fri', value: 2800 }, { label: 'Sat', value: 3200 }, { label: 'Sun', value: 2400 }
  ]

  return (
    <div className="space-y-6">
      {/* Orders Trend - Full Width */}
      <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-pink-500"></span>
            Orders Trend
          </CardTitle>
          <p className="text-sm text-slate-500">Monthly performance overview</p>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          <OrdersLineChart data={ordersByMonth} />
        </CardContent>
      </Card>

      {/* Charts Row - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Performance */}
        <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Delivery Performance
            </CardTitle>
            <p className="text-sm text-slate-500">On-time delivery rate</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2 pb-6">
            <DeliveryPieChart onTime={onTimeData} delayed={delayedData} />
            <div className="mt-5 flex gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"></div>
                <span className="text-sm font-semibold text-slate-700">On Time</span>
                <span className="text-sm font-bold text-emerald-600">{onTimeData}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-lg shadow-red-400/30"></div>
                <span className="text-sm font-semibold text-slate-700">Delayed</span>
                <span className="text-sm font-bold text-red-500">{delayedData}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pizza Sizes */}
        <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 to-pink-500"></div>
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
              Pizza Sizes
            </CardTitle>
            <p className="text-sm text-slate-500">Size distribution</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2 pb-6">
            <PizzaSizeChart data={pizzaSizes} />
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {pizzaSizes.map((p: any, i: any) => (
                <span key={p.size} className="px-3 py-1.5 bg-slate-50 rounded-full text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm">
                  {p.size} <span className="text-slate-900 font-bold ml-1">{p.count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic by Hour */}
      <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Orders by Hour
          </CardTitle>
          <p className="text-sm text-slate-500">Peak hours analysis</p>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          <TrafficBarChart data={trafficByHour} />
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Weekly Revenue
          </CardTitle>
          <p className="text-sm text-slate-500">Revenue by day</p>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          <RevenueChart data={revenueData} />
        </CardContent>
      </Card>
    </div>
  )
}
