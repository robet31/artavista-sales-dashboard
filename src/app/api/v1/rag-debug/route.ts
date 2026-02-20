import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const totalCount = await prisma.deliveryData.count()
    const restaurantCount = await prisma.restaurant.count()
    
    const summary = await prisma.deliveryData.aggregate({
      _avg: { deliveryDuration: true, delayMin: true, distanceKm: true }
    })

    const sampleOrders = await prisma.deliveryData.findMany({
      take: 5,
      orderBy: { orderTime: 'desc' }
    })

    return NextResponse.json({ 
      message: 'RAG Database Debug',
      database: 'Neon PostgreSQL',
      totalDeliveryData: totalCount,
      totalRestaurants: restaurantCount,
      avgDeliveryDuration: summary._avg.deliveryDuration,
      avgDelay: summary._avg.delayMin,
      sampleOrders: sampleOrders.map(o => ({
        orderId: o.orderId,
        pizzaType: o.pizzaType,
        location: o.location,
        deliveryDuration: o.deliveryDuration
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}
