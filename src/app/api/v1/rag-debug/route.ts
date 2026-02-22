import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { count: transactionCount } = await supabase
      .from('transaction')
      .select('*', { count: 'exact', head: true })

    const { count: retailerCount } = await supabase
      .from('retailer')
      .select('*', { count: 'exact', head: true })

    const { data: transactions } = await supabase
      .from('transaction')
      .select('total_sales, operating_profit, operating_margin')
      .limit(100)

    const avgSales = transactions?.length 
      ? transactions.reduce((sum, t) => sum + (t.total_sales || 0), 0) / transactions.length 
      : 0

    const { data: sampleTransactions } = await supabase
      .from('transaction')
      .select('*, retailer(retailer_name), product(product)')
      .limit(5)
      .order('invoice_date', { ascending: false })

    return NextResponse.json({ 
      message: 'RAG Database Debug',
      database: 'Supabase PostgreSQL',
      totalTransactions: transactionCount || 0,
      totalRetailers: retailerCount || 0,
      avgSales,
      sampleTransactions: sampleTransactions?.map(t => ({
        id: t.id_transaction,
        retailer: (t as any).retailer?.retailer_name,
        product: (t as any).product?.product,
        totalSales: t.total_sales
      })) || []
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}
