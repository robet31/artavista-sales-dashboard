import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data: transactions, error } = await supabase
      .from('transaction')
      .select(`
        *,
        retailer(retailer_name),
        product(product),
        city(city),
        method(method)
      `)
      .limit(10000)

    if (error) {
      console.log('Transaction table error (may not exist):', error.message)
    }

    const { data: retailers } = await supabase
      .from('retailer')
      .select('*')
      
    const { data: products } = await supabase
      .from('product')
      .select('*')

    const { data: cities } = await supabase
      .from('city')
      .select('*')

    const data = (transactions || []).map((t: any) => ({
      id_transaction: t.id_transaction,
      id_retailer: t.id_retailer,
      retailer_name: t.retailer?.retailer_name || '',
      product: t.product?.product || '',
      method: t.method?.method || '',
      city: t.city?.city || '',
      invoice_date: t.invoice_date,
      price_per_unit: t.price_per_unit,
      unit_sold: t.unit_sold,
      total_sales: t.total_sales,
      operating_profit: t.operating_profit,
      operating_margin: t.operating_margin,
      order_count: 1
    }))

    return NextResponse.json({
      success: true,
      data: data,
      stats: {
        transactions: data.length,
        retailers: (retailers || []).length,
        products: (products || []).length,
        cities: (cities || []).length
      }
    })
  } catch (error: any) {
    console.error('All-data error:', error)
    return NextResponse.json({ 
      success: true,
      data: [],
      stats: { transactions: 0, retailers: 0, products: 0, cities: 0 },
      message: 'Database may not be ready yet'
    })
  }
}
