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
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const filterMonth = searchParams.get('month')
    const filterPizzaSize = searchParams.get('pizzaSize')
    const filterPizzaType = searchParams.get('pizzaType')
    const filterPaymentMethod = searchParams.get('paymentMethod')
    const getFilterOptions = searchParams.get('getFilterOptions') === 'true'

    // If requesting filter options, return all unique values without applying filters
    if (getFilterOptions) {
      const whereClauseForOptions: any = {}
      if (!isSuperAdmin && userRestaurantId) {
        whereClauseForOptions.restaurantId = userRestaurantId
      } else if (restaurantId && restaurantId !== 'all' && isSuperAdmin) {
        whereClauseForOptions.restaurantId = restaurantId
      }

      const [months, pizzaSizes, pizzaTypes, paymentMethods] = await Promise.all([
        prisma.deliveryData.findMany({
          where: whereClauseForOptions,
          select: { orderMonth: true },
          distinct: ['orderMonth']
        }),
        prisma.deliveryData.findMany({
          where: whereClauseForOptions,
          select: { pizzaSize: true },
          distinct: ['pizzaSize']
        }),
        prisma.deliveryData.findMany({
          where: whereClauseForOptions,
          select: { pizzaType: true },
          distinct: ['pizzaType']
        }),
        prisma.deliveryData.findMany({
          where: whereClauseForOptions,
          select: { paymentMethod: true },
          distinct: ['paymentMethod']
        })
      ])

      return NextResponse.json({
        filterOptions: {
          months: months.map(m => m.orderMonth).filter(Boolean).sort(),
          pizzaSizes: pizzaSizes.map(p => p.pizzaSize).filter(Boolean).sort(),
          pizzaTypes: pizzaTypes.map(p => p.pizzaType).filter(Boolean).sort(),
          paymentMethods: paymentMethods.map(p => p.paymentMethod).filter(Boolean).sort()
        }
      })
    }

    const whereClause: any = {}

    // GM/ADMIN can see all or filter by restaurant
    // MANAGER/STAFF can only see their assigned restaurant
    if (!isSuperAdmin && userRestaurantId) {
      whereClause.restaurantId = userRestaurantId
    } else if (restaurantId && restaurantId !== 'all' && isSuperAdmin) {
      whereClause.restaurantId = restaurantId
    }

    // Apply slicer filters
    if (filterMonth) whereClause.orderMonth = filterMonth
    if (filterPizzaSize) whereClause.pizzaSize = filterPizzaSize
    if (filterPizzaType) whereClause.pizzaType = filterPizzaType
    if (filterPaymentMethod) whereClause.paymentMethod = filterPaymentMethod

    // Get all restaurants for comparison chart (ignoring restaurant filter, only slicer filters)
    const filterOnlyClause: any = {}
    if (filterMonth) filterOnlyClause.orderMonth = filterMonth
    if (filterPizzaSize) filterOnlyClause.pizzaSize = filterPizzaSize
    if (filterPizzaType) filterOnlyClause.pizzaType = filterPizzaType
    if (filterPaymentMethod) filterOnlyClause.paymentMethod = filterPaymentMethod

    const [allRestaurants, totalOrders, ordersBySize, ordersByType, ordersByMonth, ordersByLocation, delayStats, peakHourStats, paymentStats, ordersByRestaurantRaw] = await Promise.all([
      prisma.restaurant.findMany({ select: { id: true, name: true } }),
      prisma.deliveryData.count({ where: whereClause }),
      prisma.deliveryData.groupBy({
        by: ['pizzaSize'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['pizzaType'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['orderMonth'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: { orderMonth: 'asc' }
      }),
      prisma.deliveryData.groupBy({
        by: ['location'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }],
        take: 10
      }),
      prisma.deliveryData.groupBy({
        by: ['isDelayed'],
        where: whereClause,
        _count: { orderId: true }
      }),
      prisma.deliveryData.groupBy({
        by: ['orderHour'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ orderHour: 'asc' }]
      }),
      prisma.deliveryData.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['restaurantId'],
        where: filterOnlyClause,
        _count: { orderId: true }
      })
    ])

    // Create map for restaurant orders
    const restaurantCountMap = new Map(
      ordersByRestaurantRaw.map((o: { restaurantId: string; _count: { orderId: number } }) => [o.restaurantId, o._count.orderId])
    )

    // Return ALL restaurants with their order counts
    const ordersByRestaurant = allRestaurants.map(r => ({
      restaurant: r.name,
      count: restaurantCountMap.get(r.id) || 0
    }))

    const onTimeCount = delayStats.find(d => !d.isDelayed)?._count.orderId || 0
    const delayedCount = delayStats.find(d => d.isDelayed)?._count.orderId || 0

    return NextResponse.json({
      totalOrders,
      ordersByRestaurant,
      ordersBySize: ordersBySize.map(o => ({
        size: o.pizzaSize,
        count: o._count.orderId
      })),
      ordersByType: ordersByType.map(o => ({
        type: o.pizzaType,
        count: o._count.orderId
      })),
      ordersByMonth: ordersByMonth.map(o => ({
        month: o.orderMonth,
        count: o._count.orderId
      })),
      ordersByLocation: ordersByLocation.map(o => ({
        location: o.location,
        count: o._count.orderId
      })),
      delayStats: {
        onTime: onTimeCount,
        delayed: delayedCount,
        rate: totalOrders > 0 ? (onTimeCount / totalOrders) * 100 : 0
      },
      peakHourStats: peakHourStats.map(o => ({
        hour: o.orderHour,
        count: o._count.orderId
      })),
      paymentStats: paymentStats.map(o => ({
        method: o.paymentMethod,
        count: o._count.orderId
      }))
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
