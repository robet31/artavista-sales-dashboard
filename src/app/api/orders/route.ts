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
    const retailerId = searchParams.get('restaurant')

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let whereClause = {}
    
    if (!isSuperAdmin && userRestaurantId) {
      whereClause = { restaurantId: userRestaurantId }
    } else if (retailerId && retailerId !== 'all') {
      whereClause = { restaurantId: retailerId }
    }

    const orders = await prisma.deliveryData.findMany({
      where: whereClause,
      include: {
        restaurant: true
      },
      orderBy: { orderTime: 'desc' },
      take: 100
    })

    const formattedOrders = orders.map(t => ({
      id: t.id,
      transactionId: `TXN-${t.id.substring(0, 8)}`,
      retailerId: t.restaurantId,
      retailerName: t.restaurant?.name || '-',
      productName: t.pizzaType || '-',
      methodName: t.paymentMethod || '-',
      cityName: t.location || '-',
      invoiceDate: t.orderTime,
      pricePerUnit: t.estimatedDuration,
      unitSold: t.toppingsCount,
      totalSales: t.deliveryDuration * 10,
      operatingProfit: t.distanceKm,
      operatingMargin: t.deliveryEfficiency
    }))

    return NextResponse.json(formattedOrders)
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

    const retailerId = userRestaurantId || body.retailerId

    if (!retailerId) {
      return NextResponse.json({ error: 'Retailer ID diperlukan' }, { status: 400 })
    }

    const newOrder = await prisma.deliveryData.create({
      data: {
        orderId: `ORD-${Date.now()}`,
        restaurantId: retailerId,
        location: body.cityName || 'Unknown',
        orderTime: new Date(body.invoiceDate || new Date()),
        deliveryTime: new Date(),
        deliveryDuration: body.totalSales ? Math.round(body.totalSales / 10) : 30,
        orderMonth: new Date().toISOString().slice(0, 7),
        orderHour: new Date().getHours(),
        pizzaSize: 'Medium',
        pizzaType: body.productName || 'Unknown',
        toppingsCount: body.unitSold || 1,
        pizzaComplexity: 1,
        distanceKm: body.operatingProfit || 1,
        trafficLevel: 'Normal',
        trafficImpact: 0,
        isPeakHour: false,
        isWeekend: false,
        paymentMethod: body.methodName || 'Cash',
        paymentCategory: 'Cash',
        estimatedDuration: body.pricePerUnit || 30,
        deliveryEfficiency: body.operatingMargin || 0.8,
        delayMin: 0,
        isDelayed: false,
        uploadedBy: userId
      }
    })

    return NextResponse.json(newOrder)
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
      return NextResponse.json({ error: 'Tidak berhak mengubah data retailer lain' }, { status: 403 })
    }

    const updatedOrder = await prisma.deliveryData.update({
      where: { id },
      data: {
        location: body.cityName || existingOrder.location,
        pizzaType: body.productName || existingOrder.pizzaType,
        paymentMethod: body.methodName || existingOrder.paymentMethod,
        deliveryDuration: body.totalSales ? Math.round(body.totalSales / 10) : existingOrder.deliveryDuration,
        estimatedDuration: body.pricePerUnit ?? existingOrder.estimatedDuration,
        toppingsCount: body.unitSold ?? existingOrder.toppingsCount,
        distanceKm: body.operatingProfit ?? existingOrder.distanceKm,
        deliveryEfficiency: body.operatingMargin ?? existingOrder.deliveryEfficiency
      }
    })

    return NextResponse.json(updatedOrder)
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
      return NextResponse.json({ error: 'Tidak berhak menghapus data retailer lain' }, { status: 403 })
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
