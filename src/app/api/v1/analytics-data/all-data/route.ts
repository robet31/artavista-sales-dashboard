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

    const data = await prisma.deliveryData.findMany({
      where: whereClause,
      select: {
        orderId: true,
        orderTime: true,
        deliveryTime: true,
        orderMonth: true,
        orderHour: true,
        pizzaSize: true,
        pizzaType: true,
        toppingsCount: true,
        distanceKm: true,
        trafficLevel: true,
        paymentMethod: true,
        estimatedDuration: true,
        isDelayed: true,
        delayMin: true,
        location: true
      },
      orderBy: { orderTime: 'desc' },
      take: 10000
    })

    return NextResponse.json({
      success: true,
      data: data.map(d => ({
        order_id: d.orderId,
        order_date: d.orderTime ? new Date(d.orderTime).toISOString().split('T')[0] : '',
        order_time: d.orderTime ? new Date(d.orderTime).toISOString() : '',
        delivery_time: d.deliveryTime ? new Date(d.deliveryTime).toISOString() : '',
        month: d.orderMonth || '',
        hour: d.orderHour,
        pizza_size: d.pizzaSize || '',
        pizza_type: d.pizzaType || '',
        toppings_count: d.toppingsCount,
        distance_km: d.distanceKm,
        traffic_level: d.trafficLevel || '',
        payment_method: d.paymentMethod || '',
        estimated_duration: d.estimatedDuration,
        is_delayed: d.isDelayed,
        delay_min: d.delayMin,
        location: d.location || ''
      }))
    })
  } catch (error) {
    console.error('All-data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
