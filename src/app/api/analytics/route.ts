import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const getFilterOptions = searchParams.get('getFilterOptions') === 'true'
    const restaurantId = searchParams.get('restaurantId')
    const filterMonth = searchParams.get('month')
    const filterProduct = searchParams.get('pizzaSize')
    const filterType = searchParams.get('pizzaType')
    const filterMethod = searchParams.get('paymentMethod')

    // Get all data from Supabase
    let query = supabase
      .from('transaction')
      .select(`
        *,
        retailer(retailer_name),
        product(product),
        method(method),
        city(city, state(state))
      `)

    // Apply filters if provided
    if (restaurantId && restaurantId !== 'all' && !isNaN(parseInt(restaurantId))) {
      query = query.eq('id_retailer', parseInt(restaurantId))
    }
    if (filterMonth && filterMonth !== 'all') {
      query = query.like('invoice_date', `${filterMonth}%`)
    }
    if (filterProduct && filterProduct !== 'all') {
      query = query.eq('product.product', filterProduct)
    }
    if (filterType && filterType !== 'all') {
      query = query.eq('city.city', filterType)
    }
    if (filterMethod && filterMethod !== 'all') {
      query = query.eq('method.method', filterMethod)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        totalOrders: 0,
        ordersByRestaurant: [],
        ordersByProduct: [],
        ordersByType: [],
        ordersByMonth: [],
        ordersByLocation: [],
        ordersByMethod: [],
        salesStats: { total: 0, profit: 0 }
      })
    }

    // Group by retailer
    const retailerMap = new Map()
    transactions.forEach(t => {
      const name = (t as any).retailer?.retailer_name || 'Unknown'
      if (!retailerMap.has(name)) {
        retailerMap.set(name, { count: 0, sales: 0, profit: 0 })
      }
      const current = retailerMap.get(name)
      current.count += t.unit_sold || 0
      current.sales += t.total_sales || 0
      current.profit += t.operating_profit || 0
    })

    // Group by product
    const productMap = new Map()
    transactions.forEach(t => {
      const name = (t as any).product?.product || 'Unknown'
      if (!productMap.has(name)) {
        productMap.set(name, { count: 0, sales: 0 })
      }
      const current = productMap.get(name)
      current.count += t.unit_sold || 0
      current.sales += t.total_sales || 0
    })

    // Group by method
    const methodMap = new Map()
    transactions.forEach(t => {
      const name = (t as any).method?.method || 'Unknown'
      if (!methodMap.has(name)) {
        methodMap.set(name, { count: 0, sales: 0 })
      }
      const current = methodMap.get(name)
      current.count += t.unit_sold || 0
      current.sales += t.total_sales || 0
    })

    // Group by city
    const cityMap = new Map()
    transactions.forEach(t => {
      const name = (t as any).city?.city || 'Unknown'
      if (!cityMap.has(name)) {
        cityMap.set(name, { count: 0, sales: 0 })
      }
      const current = cityMap.get(name)
      current.count += t.unit_sold || 0
      current.sales += t.total_sales || 0
    })

    // Group by month
    const monthMap = new Map()
    transactions.forEach(t => {
      const month = t.invoice_date ? t.invoice_date.substring(0, 7) : 'Unknown'
      if (!monthMap.has(month)) {
        monthMap.set(month, { count: 0, sales: 0 })
      }
      const current = monthMap.get(month)
      current.count += t.unit_sold || 0
      current.sales += t.total_sales || 0
    })

    // Calculate totals
    const totalUnits = transactions.reduce((sum, t) => sum + (t.unit_sold || 0), 0)
    const totalSales = transactions.reduce((sum, t) => sum + (t.total_sales || 0), 0)
    const totalProfit = transactions.reduce((sum, t) => sum + (t.operating_profit || 0), 0)

    // Get unique values for filters
    const months = [...monthMap.keys()].sort()
    const products = [...productMap.keys()].sort()
    const methods = [...methodMap.keys()].sort()
    const cities = [...cityMap.keys()].sort()

    // Also get pizzaTypes (product category if available)
    const pizzaTypes = cities

    if (getFilterOptions) {
      return NextResponse.json({
        filterOptions: {
          months,
          pizzaSizes: products,
          pizzaTypes,
          paymentMethods: methods
        }
      })
    }

    return NextResponse.json({
      totalOrders: totalUnits,
      ordersByRestaurant: Array.from(retailerMap.entries()).map(([name, data]: [string, any]) => ({
        restaurant: name,
        count: data.count,
        sales: data.sales
      })),
      ordersByProduct: Array.from(productMap.entries()).map(([name, data]: [string, any]) => ({
        product: name,
        count: data.count,
        sales: data.sales
      })),
      ordersByMethod: Array.from(methodMap.entries()).map(([name, data]: [string, any]) => ({
        method: name,
        count: data.count,
        sales: data.sales
      })),
      ordersByMonth: Array.from(monthMap.entries()).map(([month, data]: [string, any]) => ({
        month,
        count: data.count,
        sales: data.sales
      })),
      ordersByLocation: Array.from(cityMap.entries()).map(([city, data]: [string, any]) => ({
        location: city,
        count: data.count,
        sales: data.sales
      })).slice(0, 10),
      salesStats: {
        total: totalSales,
        profit: totalProfit,
        avgOrderValue: totalUnits > 0 ? totalSales / totalUnits : 0
      }
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
