import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { salesService } from '@/lib/sales-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await salesService.getDashboardStats()

    if (!stats || stats.totalTransactions === 0) {
      return NextResponse.json({
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgOrderValue: 0,
        avgMargin: 0,
        deliveryPerformance: [],
        pizzaSizes: [],
        pizzaTypes: [],
        paymentMethods: [],
        ordersByRestaurant: [],
        byCity: [],
        byState: [],
        peakHours: []
      })
    }

    const deliveryPerformance = stats.byMonth.map((m: any) => ({
      label: m.label,
      value: m.value
    }))

    const pizzaSizes = stats.byProduct.slice(0, 5).map((p: any) => ({
      label: p.label,
      value: p.units
    }))

    const pizzaTypes = stats.byProduct.map((p: any) => ({
      label: p.label,
      value: p.profit || p.revenue || 0
    }))

    const trafficImpact = stats.byState?.slice(0, 6).map((s: any) => ({
      label: s.label,
      value: s.value
    })) || []

    const paymentMethods = stats.byMethod.map((m: any) => ({
      label: m.label,
      value: m.value
    }))

    const ordersByRestaurant = stats.byRetailer.map((r: any) => ({
      label: r.label,
      value: r.value
    }))

    const peakHours = stats.byMonth.slice(0, 12).map((m: any) => ({
      label: m.label,
      value: m.units
    }))

    return NextResponse.json({
      totalOrders: stats.totalUnits,
      totalRevenue: stats.totalRevenue,
      totalProfit: stats.totalProfit,
      avgOrderValue: stats.avgOrderValue,
      avgMargin: stats.avgMargin,
      delayedOrders: 0,
      onTimeRate: stats.avgMargin,
      peakHours,
      pizzaSizes,
      pizzaTypes,
      deliveryPerformance,
      trafficImpact,
      paymentMethods,
      weekendVsWeekday: { weekend: 0, weekday: 0 },
      peakOffPeak: { peak: 0, offPeak: 0 },
      avgDistanceKm: 0,
      avgDelayMin: 0,
      ordersByRestaurant,
      byCity: stats.byCity,
      byState: stats.byState
    })

  } catch (error) {
    console.error('Dashboard charts error:', error)
    return NextResponse.json({ 
      totalOrders: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgOrderValue: 0,
      deliveryPerformance: [],
      pizzaSizes: [],
      pizzaTypes: [],
      paymentMethods: [],
      ordersByRestaurant: [],
      byCity: [],
      byState: [],
      peakHours: []
    }, { status: 200 })
  }
}
