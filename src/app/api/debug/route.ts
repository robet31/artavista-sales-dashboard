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

    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurant')
    const debug = searchParams.get('debug') === 'true'
    const raw = searchParams.get('raw') === 'true'

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    console.log('Debug API - userRole:', userRole, 'userRestaurantId:', userRestaurantId, 'isSuperAdmin:', isSuperAdmin)

    // If raw=true, return all data regardless of user permissions (for debugging)
    let whereClause: any = {}
    if (!raw && !isSuperAdmin && userRestaurantId) {
      whereClause.restaurantId = userRestaurantId
    } else if (!raw && restaurantId && restaurantId !== 'all') {
      whereClause.restaurantId = restaurantId
    }

    console.log('Debug API - whereClause:', whereClause)

    const count = await prisma.deliveryData.count({
      where: whereClause
    })

    console.log('Debug API - total count:', count)

    const recentData = await prisma.deliveryData.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' },
      take: debug ? 50 : 5,
      select: {
        id: true,
        orderId: true,
        pizzaSize: true,
        pizzaType: true,
        location: true,
        uploadedAt: true,
        uploadedBy: true,
        restaurantId: true
      }
    })

    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            deliveryData: true
          }
        }
      }
    })

    // Get all delivery data for super admin debugging
    let allData: any[] = []
    if (raw && isSuperAdmin) {
      allData = await prisma.deliveryData.findMany({
        take: 20,
        orderBy: { uploadedAt: 'desc' }
      })
    }

    return NextResponse.json({
      totalCount: count,
      recentData,
      restaurants: restaurants.map(r => ({
        id: r.id,
        name: r.name,
        code: r.code,
        dataCount: r._count.deliveryData
      })),
      userRole,
      userRestaurantId,
      isSuperAdmin,
      raw,
      whereClause,
      allData: raw ? allData : undefined
    })
  } catch (error: any) {
    console.error('Debug data error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error', stack: error.stack }, { status: 500 })
  }
}
