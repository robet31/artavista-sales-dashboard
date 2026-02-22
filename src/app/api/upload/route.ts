import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data: transactionCount, error: countError } = await supabase
      .from('transaction')
      .select('*', { count: 'exact', head: true })

    const { data: retailers, error: retailerError } = await supabase
      .from('retailer')
      .select('*')

    const { data: recentData, error: recentError } = await supabase
      .from('transaction')
      .select('*, retailer(retailer_name), product(product), city(city)')
      .order('invoice_date', { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalCount: transactionCount?.length || 0,
      retailers: retailers || [],
      recentData: recentData || []
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const cleanedData = body.cleanedData || []

    if (cleanedData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data untuk diupload',
        data: { totalRows: 0, validRows: 0, invalidRows: 0, qualityScore: 0, errors: [] }
      }, { status: 400 })
    }

    const userId = session.user?.email || 'unknown'

    // Get master data IDs from Supabase
    const { data: retailers } = await supabase.from('retailer').select('id_retailer, retailer_name')
    const { data: products } = await supabase.from('product').select('id_product, product')
    const { data: methods } = await supabase.from('method').select('id_method, method')
    const { data: cities } = await supabase.from('city').select('id_city, city')

    // Helper functions
    const getRetailerId = (name: string) => {
      if (!retailers) return null
      const found = retailers.find(r => r.retailer_name?.toLowerCase() === name?.toLowerCase())
      return found?.id_retailer || null
    }

    const getProductId = (name: string) => {
      if (!products) return null
      const found = products.find(p => p.product?.toLowerCase() === name?.toLowerCase())
      return found?.id_product || null
    }

    const getMethodId = (name: string) => {
      if (!methods || !name) return null
      const found = methods.find(m => m.method?.toLowerCase() === name?.toLowerCase())
      return found?.id_method || null
    }

    const getCityId = (name: string) => {
      if (!cities || !name) return null
      const found = cities.find(c => c.city?.toLowerCase() === name?.toLowerCase())
      return found?.id_city || null
    }

    // Create upload history
    const { data: uploadRecord } = await supabase
      .from('upload_history')
      .insert([{
        file_name: 'uploaded_file.xlsx',
        system_name: 'adidas_sales',
        status: 'processing',
        total_rows: cleanedData.length,
        uploaded_by: userId,
        uploaded_date: new Date().toISOString()
      }])
      .select()
      .single()

    const uploadId = uploadRecord?.id_upload

    // Transform and insert transactions - using new field names from cleaning service
    const transactions = cleanedData.map((row: any) => ({
      id_retailer: getRetailerId(row.retailer) || 1,
      id_product: getProductId(row.product) || 1,
      id_method: getMethodId(row.sales_method),
      id_city: getCityId(row.city) || 1,
      id_upload: uploadId,
      invoice_date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      price_per_unit: parseFloat(row.price_per_unit) || 0,
      unit_sold: parseInt(row.units_sold) || 1,
      total_sales: parseFloat(row.total_sales) || 0,
      operating_profit: parseFloat(row.operating_profit) || 0,
      operating_margin: parseFloat(row.operating_margin) || 0
    })).filter((t: any) => t.total_sales > 0)

    // Insert in batches
    const batchSize = 100
    let successfullySaved = 0
    let failedRows = 0

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      const { error } = await supabase.from('transaction').insert(batch)
      
      if (error) {
        console.error('Supabase insert error:', error)
        failedRows += batch.length
      } else {
        successfullySaved += batch.length
      }
    }

    // Update upload history status
    if (uploadId) {
      await supabase
        .from('upload_history')
        .update({ 
          status: failedRows > 0 ? 'partial' : 'success',
          note: `Saved: ${successfullySaved}, Failed: ${failedRows}`
        })
        .eq('id_upload', uploadId)
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil upload ${successfullySaved} dari ${cleanedData.length} baris data`,
      data: {
        totalRows: cleanedData.length,
        validRows: successfullySaved,
        invalidRows: failedRows,
        qualityScore: successfullySaved > 0 ? 100 : 0,
        errors: []
      },
      lastUpdate: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
