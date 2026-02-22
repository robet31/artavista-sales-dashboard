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

    const [retailersRes, productsRes, methodsRes, citiesRes] = await Promise.all([
      supabase.from('retailer').select('*').order('retailer_name'),
      supabase.from('product').select('*').order('product'),
      supabase.from('method').select('*').order('method'),
      supabase.from('city').select('*').order('city')
    ])

    const formattedRetailers = (retailersRes.data || []).map(r => ({
      id: r.id_retailer,
      id_retailer: r.id_retailer,
      retailer_name: r.retailer_name,
      code: r.retailer_name?.substring(0, 3).toUpperCase(),
      location: r.location,
      description: r.description,
      is_active: r.is_active
    }))

    const formattedProducts = (productsRes.data || []).map(p => ({
      id: p.id_product,
      id_product: p.id_product,
      product: p.product
    }))

    const formattedMethods = (methodsRes.data || []).map(m => ({
      id: m.id_method,
      id_method: m.id_method,
      method: m.method
    }))

    const formattedCities = (citiesRes.data || []).map(c => ({
      id: c.id_city,
      id_city: c.id_city,
      city: c.city,
      id_state: c.id_state
    }))

    return NextResponse.json({
      retailers: formattedRetailers,
      products: formattedProducts,
      methods: formattedMethods,
      cities: formattedCities
    })
  } catch (error: any) {
    console.error('Master data error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
