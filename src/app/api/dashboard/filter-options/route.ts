import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: retailers } = await supabase.from('retailer').select('id_retailer, retailer_name').order('retailer_name')
    const { data: products } = await supabase.from('product').select('id_product, product').order('product')
    const { data: methods } = await supabase.from('method').select('id_method, method').order('method')
    const { data: cities } = await supabase.from('city').select('id_city, city').order('city')

    const { data: transactions } = await supabase.from('transaction').select('invoice_date').order('invoice_date')
    
    const monthsSet = new Set<string>()
    transactions?.forEach(t => {
      if (t.invoice_date) {
        monthsSet.add(t.invoice_date.substring(0, 7))
      }
    })
    const months = Array.from(monthsSet).sort().reverse()

    return NextResponse.json({
      retailers: retailers || [],
      products: products || [],
      methods: methods || [],
      cities: cities || [],
      months
    })

  } catch (error) {
    console.error('Filter options error:', error)
    return NextResponse.json({ 
      retailers: [],
      products: [],
      methods: [],
      cities: [],
      months: []
    }, { status: 200 })
  }
}
