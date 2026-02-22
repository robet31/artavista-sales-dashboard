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

    let whereClause = {}
    
    if (!isSuperAdmin && userRestaurantId) {
      whereClause = { restaurantId: userRestaurantId }
    }

    const transactions = await prisma.deliveryData.findMany({
      where: whereClause,
      orderBy: { orderTime: 'desc' },
      take: 10000
    })

    const totalOrders = transactions.length
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.deliveryDuration * 10 || 0), 0)
    const totalDistance = transactions.reduce((sum, t) => sum + (t.distanceKm || 0), 0)
    const avgDeliveryTime = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + (t.deliveryDuration || 0), 0) / transactions.length 
      : 0

    return NextResponse.json({
      success: true,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      total_distance: totalDistance,
      avg_delivery_time: avgDeliveryTime
    })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
