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

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let query = supabase
      .from('transaction')
      .select('*')

    if (!isSuperAdmin && userRestaurantId) {
      query = query.eq('id_retailer', parseInt(userRestaurantId))
    }

    const { data: transactions, error } = await query

    if (error) throw error

    const totalOrders = (transactions || []).length
    const totalRevenue = (transactions || []).reduce((sum, t) => sum + (t.total_sales || 0), 0)
    const totalProfit = (transactions || []).reduce((sum, t) => sum + (t.operating_profit || 0), 0)

    return NextResponse.json({
      success: true,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0
    })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
