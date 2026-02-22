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

    return NextResponse.json({
      retailers: retailersRes.data || [],
      products: productsRes.data || [],
      methods: methodsRes.data || [],
      cities: citiesRes.data || []
    })
  } catch (error: any) {
    console.error('Master data error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
