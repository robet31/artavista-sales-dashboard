import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const userRestaurantId = (session.user as any)?.restaurantId

    let whereClause = {}
    if (userRole === 'GM' || userRole === 'ADMIN_PUSAT') {
      whereClause = {}
    } else if (userRestaurantId) {
      whereClause = { restaurantId: userRestaurantId }
    }

    const [
      ordersByMonth,
      pizzaSizesData,
      pizzaTypesData,
      trafficData,
      isDelayedData,
      avgDeliveryTime,
      paymentMethodData,
      weekendData,
      peakHourData,
      distanceData,
      avgDelayData,
      restaurantData
    ] = await Promise.all([
      prisma.deliveryData.groupBy({
        by: ['orderMonth'],
        where: whereClause,
        _count: true,
        orderBy: { orderMonth: 'asc' }
      }),
      prisma.deliveryData.groupBy({
        by: ['pizzaSize'],
        where: whereClause,
        _count: true
      }),
      prisma.deliveryData.groupBy({
        by: ['pizzaType'],
        where: whereClause,
        _count: true
      }),
      prisma.deliveryData.groupBy({
        by: ['orderHour'],
        where: whereClause,
        _count: true,
        orderBy: { orderHour: 'asc' }
      }),
      prisma.deliveryData.groupBy({
        by: ['isDelayed'],
        where: whereClause,
        _count: true
      }),
      prisma.deliveryData.aggregate({
        where: whereClause,
        _avg: { deliveryDuration: true }
      }),
      prisma.deliveryData.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: true
      }),
      prisma.deliveryData.groupBy({
        by: ['isWeekend'],
        where: whereClause,
        _count: true
      }),
      prisma.deliveryData.groupBy({
        by: ['isPeakHour'],
        where: whereClause,
        _count: true
      }),
      prisma.deliveryData.aggregate({
        where: whereClause,
        _avg: { distanceKm: true }
      }),
      prisma.deliveryData.aggregate({
        where: { ...whereClause, delayMin: { gt: 0 } },
        _avg: { delayMin: true }
      }),
      prisma.deliveryData.groupBy({
        by: ['restaurantId'],
        where: whereClause,
        _count: true
      })
    ])

    const totalOrders = ordersByMonth.reduce((sum, m) => sum + m._count, 0)

    const peakHours = trafficData
      .filter(t => t.orderHour !== null)
      .sort((a, b) => b._count - a._count)
      .slice(0, 8)
      .map(t => ({
        label: `${String(t.orderHour).padStart(2, '0')}:00`,
        value: t._count
      }))

    const pizzaSizes = pizzaSizesData.map(s => ({
      label: s.pizzaSize || 'Unknown',
      value: s._count
    }))

    const pizzaTypes = pizzaTypesData.map(t => ({
      label: t.pizzaType || 'Unknown',
      value: t._count
    }))

    const deliveryPerformance = ordersByMonth.map(m => ({
      label: m.orderMonth,
      value: m._count
    }))

    const trafficImpactData = await prisma.deliveryData.groupBy({
      by: ['trafficLevel'],
      where: whereClause,
      _count: true
    })
    const trafficImpact = trafficImpactData.map(t => ({
      label: t.trafficLevel || 'Unknown',
      value: t._count
    }))

    const onTimeCount = isDelayedData.find(d => !d.isDelayed)?._count || 0
    const delayedCount = isDelayedData.find(d => d.isDelayed)?._count || 0
    const onTimeRate = totalOrders > 0 ? Math.round((onTimeCount / totalOrders) * 100) : 0

    const avgDeliveryTimeMinutes = Math.round(avgDeliveryTime._avg.deliveryDuration || 0)

    const paymentMethods = paymentMethodData.map(p => ({
      label: p.paymentMethod || 'Unknown',
      value: p._count
    }))

    const weekendCount = weekendData.find(d => d.isWeekend)?._count || 0
    const weekdayCount = weekendData.find(d => !d.isWeekend)?._count || 0

    const peakHourCount = peakHourData.find(d => d.isPeakHour)?._count || 0
    const offPeakCount = peakHourData.find(d => !d.isPeakHour)?._count || 0

    const avgDistanceKm = Math.round((distanceData._avg.distanceKm || 0) * 10) / 10
    const avgDelayMin = Math.round(avgDelayData._avg.delayMin || 0)

    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true }
    })
    const restaurantMap = new Map(restaurants.map(r => [r.id, r.name]))

    // Create a map of restaurantId to count
    const restaurantCountMap = new Map(
      restaurantData.map((r: { restaurantId: string | null; _count: number }) => [r.restaurantId || '', r._count])
    )

    // Return ALL restaurants with their order counts (including 0)
    const ordersByRestaurant = restaurants.map(r => ({
      label: r.name,
      value: restaurantCountMap.get(r.id) || 0
    }))

    return NextResponse.json({
      totalOrders,
      avgDeliveryTime: avgDeliveryTimeMinutes,
      delayedOrders: delayedCount,
      onTimeRate,
      peakHours,
      pizzaSizes,
      pizzaTypes,
      deliveryPerformance,
      trafficImpact,
      paymentMethods,
      weekendVsWeekday: {
        weekend: weekendCount,
        weekday: weekdayCount
      },
      peakOffPeak: {
        peak: peakHourCount,
        offPeak: offPeakCount
      },
      avgDistanceKm,
      avgDelayMin,
      ordersByRestaurant
    })

  } catch (error) {
    console.error('Dashboard charts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
