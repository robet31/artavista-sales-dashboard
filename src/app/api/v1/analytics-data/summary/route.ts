import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    const whereClause: any = {}
    
    if (!isSuperAdmin && userRestaurantId) {
      whereClause.restaurantId = userRestaurantId
    }

    const [totalOrders, deliveryStats, distanceResult] = await Promise.all([
      prisma.deliveryData.count({ where: whereClause }),
      prisma.deliveryData.aggregate({
        where: whereClause,
        _avg: { estimatedDuration: true }
      }),
      prisma.deliveryData.aggregate({
        where: whereClause,
        _avg: { distanceKm: true }
      })
    ])

    const delayStats = await prisma.deliveryData.groupBy({
      by: ['isDelayed'],
      where: whereClause,
      _count: { orderId: true }
    })

    const onTimeCount = delayStats.find(d => !d.isDelayed)?._count.orderId || 0
    const delayedCount = delayStats.find(d => d.isDelayed)?._count.orderId || 0

    return NextResponse.json({
      success: true,
      total_orders: totalOrders,
      total_revenue: 0,
      avg_delivery_time: deliveryStats._avg.estimatedDuration || 0,
      avg_distance: distanceResult._avg.distanceKm || 0,
      on_time_rate: totalOrders > 0 ? (onTimeCount / totalOrders) * 100 : 0,
      delayed_orders: delayedCount
    })
  } catch (error) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
