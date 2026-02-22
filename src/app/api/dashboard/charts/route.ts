import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { salesService } from '@/lib/sales-service'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const retailerId = searchParams.get('retailer')
    const month = searchParams.get('month')
    const product = searchParams.get('product')
    const method = searchParams.get('method')
    const city = searchParams.get('city')

    let query = supabase
      .from('transaction')
      .select(`
        *,
        retailer!inner(id_retailer, retailer_name),
        product!inner(id_product, product),
        method!inner(id_method, method),
        city!inner(id_city, city, state!inner(state))
      `)

    if (retailerId && retailerId !== 'all') {
      query = query.eq('retailer.id_retailer', parseInt(retailerId))
    }
    if (month && month !== 'all') {
      query = query.like('invoice_date', `${month}%`)
    }
    if (product && product !== 'all') {
      query = query.eq('product.product', product)
    }
    if (method && method !== 'all') {
      query = query.eq('method.method', method)
    }
    if (city && city !== 'all') {
      query = query.eq('city.city', city)
    }

    const { data: transactions, error } = await query

    if (error) throw error

    if (!transactions || transactions.length === 0) {
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
        peakHours: [],
        filterOptions: {
          months: [],
          products: [],
          methods: [],
          cities: []
        }
      })
    }

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_sales || 0), 0)
    const totalProfit = transactions.reduce((sum, t) => sum + (t.operating_profit || 0), 0)
    const totalUnits = transactions.reduce((sum, t) => sum + (t.unit_sold || 0), 0)
    const totalTransactions = transactions.length

    const byProduct: Record<string, { units: number; revenue: number; profit: number }> = {}
    const byRetailer: Record<string, { units: number; revenue: number; profit: number }> = {}
    const byMethod: Record<string, { units: number; revenue: number }> = {}
    const byMonth: Record<string, { units: number; revenue: number }> = {}
    const byCity: Record<string, { units: number; revenue: number }> = {}

    for (const t of transactions) {
      const productName = (t as any).product?.product || 'Unknown'
      const retailerName = (t as any).retailer?.retailer_name || 'Unknown'
      const methodName = (t as any).method?.method || 'Unknown'
      const cityName = (t as any).city?.city || 'Unknown'
      const monthVal = t.invoice_date ? t.invoice_date.substring(0, 7) : 'Unknown'

      if (!byProduct[productName]) byProduct[productName] = { units: 0, revenue: 0, profit: 0 }
      byProduct[productName].units += t.unit_sold || 0
      byProduct[productName].revenue += t.total_sales || 0
      byProduct[productName].profit += t.operating_profit || 0

      if (!byRetailer[retailerName]) byRetailer[retailerName] = { units: 0, revenue: 0, profit: 0 }
      byRetailer[retailerName].units += t.unit_sold || 0
      byRetailer[retailerName].revenue += t.total_sales || 0
      byRetailer[retailerName].profit += t.operating_profit || 0

      if (!byMethod[methodName]) byMethod[methodName] = { units: 0, revenue: 0 }
      byMethod[methodName].units += t.unit_sold || 0
      byMethod[methodName].revenue += t.total_sales || 0

      if (!byMonth[monthVal]) byMonth[monthVal] = { units: 0, revenue: 0 }
      byMonth[monthVal].units += t.unit_sold || 0
      byMonth[monthVal].revenue += t.total_sales || 0

      if (!byCity[cityName]) byCity[cityName] = { units: 0, revenue: 0 }
      byCity[cityName].units += t.unit_sold || 0
      byCity[cityName].revenue += t.total_sales || 0
    }

    const pizzaSizes = Object.entries(byProduct)
      .map(([name, data]) => ({ label: name, value: data.units }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const pizzaTypes = Object.entries(byProduct)
      .map(([name, data]) => ({ label: name, value: data.revenue }))
      .sort((a, b) => b.value - a.value)

    const deliveryPerformance = Object.entries(byMonth)
      .map(([month, data]) => ({ label: month, value: data.revenue }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const ordersByRestaurant = Object.entries(byRetailer)
      .map(([name, data]) => ({ label: name, value: data.revenue }))
      .sort((a, b) => b.value - a.value)

    const paymentMethods = Object.entries(byMethod)
      .map(([name, data]) => ({ label: name, value: data.units }))
      .sort((a, b) => b.value - a.value)

    const peakHours = Object.entries(byMonth)
      .map(([month, data]) => ({ label: month, value: data.units }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const cityData = Object.entries(byCity)
      .map(([name, data]) => ({ label: name, value: data.revenue }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    return NextResponse.json({
      totalOrders: totalUnits,
      totalRevenue,
      totalProfit,
      avgOrderValue: totalRevenue / (totalTransactions || 1),
      avgMargin: (totalProfit / (totalRevenue || 1)) * 100,
      delayedOrders: 0,
      onTimeRate: (totalProfit / (totalRevenue || 1)) * 100,
      peakHours,
      pizzaSizes,
      pizzaTypes,
      deliveryPerformance,
      trafficImpact: cityData,
      paymentMethods,
      weekendVsWeekday: { weekend: 0, weekday: 0 },
      peakOffPeak: { peak: 0, offPeak: 0 },
      avgDistanceKm: 0,
      avgDelayMin: 0,
      ordersByRestaurant,
      byCity: cityData,
      byState: cityData
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
