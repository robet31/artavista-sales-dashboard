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

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let whereClause: any = {}

    if (!isSuperAdmin && userRestaurantId) {
      whereClause.restaurantId = userRestaurantId
    } else if (restaurantId && restaurantId !== 'all') {
      whereClause.restaurantId = restaurantId
    }

    const orders = await prisma.deliveryData.findMany({
      where: whereClause,
      orderBy: { orderTime: 'desc' },
      take: 100
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const userRestaurantId = (session.user as any)?.restaurantId
    const userId = (session.user as any)?.id || session.user?.email || 'unknown'

    const restaurantId = userRestaurantId || body.restaurantId

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID diperlukan' }, { status: 400 })
    }

    const order = await prisma.deliveryData.create({
      data: {
        orderId: body.orderId,
        restaurantId,
        location: body.location || '',
        orderTime: new Date(body.orderTime),
        deliveryTime: new Date(body.deliveryTime),
        deliveryDuration: body.deliveryDuration || 30,
        orderMonth: body.orderMonth || 'January',
        orderHour: body.orderHour || 0,
        pizzaSize: body.pizzaSize || 'Medium',
        pizzaType: body.pizzaType || 'Margherita',
        toppingsCount: body.toppingsCount || 0,
        pizzaComplexity: 0,
        distanceKm: body.distanceKm || 0,
        trafficLevel: body.trafficLevel || 'Medium',
        trafficImpact: 1,
        isPeakHour: body.isPeakHour || false,
        isWeekend: body.isWeekend || false,
        paymentMethod: body.paymentMethod || 'Cash',
        paymentCategory: 'Offline',
        estimatedDuration: body.deliveryDuration || 30,
        deliveryEfficiency: null,
        delayMin: body.isDelayed ? 10 : 0,
        isDelayed: body.isDelayed || false,
        restaurantAvgTime: null,
        uploadedBy: userId,
        uploadedAt: new Date(),
        validatedAt: new Date(),
        validatedBy: userId,
        qualityScore: 100,
        version: 1
      }
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID diperlukan' }, { status: 400 })
    }

    const body = await req.json()
    const userRestaurantId = (session.user as any)?.restaurantId

    const existingOrder = await prisma.deliveryData.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    if (!isSuperAdmin && userRestaurantId && existingOrder.restaurantId !== userRestaurantId) {
      return NextResponse.json({ error: 'Tidak berhak mengubah data restoran lain' }, { status: 403 })
    }

    const order = await prisma.deliveryData.update({
      where: { id },
      data: {
        orderId: body.orderId,
        location: body.location,
        orderTime: new Date(body.orderTime),
        deliveryTime: new Date(body.deliveryTime),
        deliveryDuration: body.deliveryDuration,
        orderMonth: body.orderMonth,
        orderHour: body.orderHour,
        pizzaSize: body.pizzaSize,
        pizzaType: body.pizzaType,
        toppingsCount: body.toppingsCount,
        distanceKm: body.distanceKm,
        trafficLevel: body.trafficLevel,
        isPeakHour: body.isPeakHour,
        isWeekend: body.isWeekend,
        paymentMethod: body.paymentMethod,
        isDelayed: body.isDelayed,
        delayMin: body.isDelayed ? 10 : 0,
        version: { increment: 1 }
      }
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID diperlukan' }, { status: 400 })
    }

    const userRestaurantId = (session.user as any)?.restaurantId

    const existingOrder = await prisma.deliveryData.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    if (!isSuperAdmin && userRestaurantId && existingOrder.restaurantId !== userRestaurantId) {
      return NextResponse.json({ error: 'Tidak berhak menghapus data restoran lain' }, { status: 403 })
    }

    await prisma.deliveryData.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Order dihapus' })
  } catch (error: any) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
