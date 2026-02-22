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
    const retailerId = searchParams.get('restaurant')

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let query = supabase
      .from('transaction')
      .select(`
        *,
        retailer(retailer_name),
        product(product),
        method(method),
        city(city)
      `)
      .order('invoice_date', { ascending: false })
      .limit(100)

    if (!isSuperAdmin && userRestaurantId) {
      query = query.eq('id_retailer', parseInt(userRestaurantId))
    } else if (retailerId && retailerId !== 'all') {
      query = query.eq('id_retailer', parseInt(retailerId))
    }

    const { data: orders, error } = await query

    if (error) throw error

    const formattedOrders = (orders || []).map(t => ({
      id: t.id_transaction,
      transactionId: `TXN-${t.id_transaction}`,
      retailerId: t.id_retailer,
      retailerName: (t as any).retailer?.retailer_name || '-',
      productName: (t as any).product?.product || '-',
      methodName: (t as any).method?.method || '-',
      cityName: (t as any).city?.city || '-',
      invoiceDate: t.invoice_date,
      pricePerUnit: t.price_per_unit,
      unitSold: t.unit_sold,
      totalSales: t.total_sales,
      operatingProfit: t.operating_profit,
      operatingMargin: t.operating_margin
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

    const retailerId = userRestaurantId ? parseInt(userRestaurantId) : body.retailerId

    if (!retailerId) {
      return NextResponse.json({ error: 'Retailer ID diperlukan' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('transaction')
      .insert([{
        id_retailer: retailerId,
        id_product: body.productId || 1,
        id_method: body.methodId || 1,
        id_city: body.cityId || 1,
        invoice_date: body.invoiceDate || new Date().toISOString().split('T')[0],
        price_per_unit: body.pricePerUnit || 0,
        unit_sold: body.unitSold || 1,
        total_sales: body.totalSales || 0,
        operating_profit: body.operatingProfit || 0,
        operating_margin: body.operatingMargin || 0
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
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

    const userRole = (session.user as any).role || (session.user as any).position
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    const updateData: any = {}
    if (body.pricePerUnit) updateData.price_per_unit = body.pricePerUnit
    if (body.unitSold) updateData.unit_sold = body.unitSold
    if (body.totalSales) updateData.total_sales = body.totalSales
    if (body.operatingProfit) updateData.operating_profit = body.operatingProfit
    if (body.operatingMargin) updateData.operating_margin = body.operatingMargin

    const { data, error } = await supabase
      .from('transaction')
      .update(updateData)
      .eq('id_transaction', parseInt(id))
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
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

    const { error } = await supabase
      .from('transaction')
      .delete()
      .eq('id_transaction', parseInt(id))

    if (error) throw error

    return NextResponse.json({ message: 'Order dihapus' })
  } catch (error: any) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
