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
    const restaurantId = searchParams.get('restaurant')
    const debug = searchParams.get('debug') === 'true'
    const raw = searchParams.get('raw') === 'true'

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    console.log('Debug API - userRole:', userRole, 'userRestaurantId:', userRestaurantId, 'isSuperAdmin:', isSuperAdmin)

    // Get transaction count
    let countQuery = supabase
      .from('transaction')
      .select('*', { count: 'exact', head: true })

    if (!raw && !isSuperAdmin && userRestaurantId) {
      countQuery = countQuery.eq('id_retailer', parseInt(userRestaurantId))
    } else if (!raw && restaurantId && restaurantId !== 'all') {
      countQuery = countQuery.eq('id_retailer', parseInt(restaurantId))
    }

    const { count, error: countError } = await countQuery

    console.log('Debug API - total count:', count)

    // Get recent transactions
    let recentQuery = supabase
      .from('transaction')
      .select(`
        id_transaction,
        total_sales,
        unit_sold,
        operating_profit,
        invoice_date,
        retailer(retailer_name),
        product(product)
      `)
      .order('invoice_date', { ascending: false })
      .limit(debug ? 50 : 5)

    if (!raw && !isSuperAdmin && userRestaurantId) {
      recentQuery = recentQuery.eq('id_retailer', parseInt(userRestaurantId))
    } else if (!raw && restaurantId && restaurantId !== 'all') {
      recentQuery = recentQuery.eq('id_retailer', parseInt(restaurantId))
    }

    const { data: recentData, error: recentError } = await recentQuery

    // Get retailers
    const { data: retailers, error: retailerError } = await supabase
      .from('retailer')
      .select('*')

    // Get all data for super admin debugging
    let allData: any[] = []
    if (raw && isSuperAdmin) {
      const { data } = await supabase
        .from('transaction')
        .select('*')
        .limit(20)
      allData = data || []
    }

    return NextResponse.json({
      totalCount: count || 0,
      recentData: recentData?.map(t => ({
        id: t.id_transaction,
        total_sales: t.total_sales,
        unit_sold: t.unit_sold,
        operating_profit: t.operating_profit,
        invoice_date: t.invoice_date,
        retailer: (t as any).retailer?.retailer_name,
        product: (t as any).product?.product
      })) || [],
      retailers: retailers?.map(r => ({
        id: r.id_retailer,
        name: r.retailer_name,
        code: r.retailer_name.substring(0, 3).toUpperCase()
      })) || [],
      userRole,
      userRestaurantId,
      isSuperAdmin,
      raw,
      allData: raw ? allData : undefined
    })
  } catch (error: any) {
    console.error('Debug data error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error', stack: error.stack }, { status: 500 })
  }
}
