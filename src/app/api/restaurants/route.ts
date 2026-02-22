import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Ambil semua retailer
export async function GET(req: NextRequest) {
  try {
    // Cek session (tidak wajib untuk viewing)
    // const session = await getServerSession(authOptions)
    
    const { data: retailers, error } = await supabase
      .from('retailer')
      .select('*')
      .order('retailer_name', { ascending: true })

    if (error) {
      console.error('Error fetching retailers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedRestaurants = retailers.map(r => ({
      id: r.id_retailer,
      name: r.retailer_name,
      code: r.retailer_name ? r.retailer_name.substring(0, 3).toUpperCase() : 'N/A',
      location: r.location || '',
      description: r.description || '',
      isActive: r.is_active !== false,
      createdAt: r.created_at
    }))

    return NextResponse.json({ restaurants: formattedRestaurants })

  } catch (error: any) {
    console.error('Restaurants error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Tambah retailer baru
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    // Hanya GM dan ADMIN_PUSAT yang bisa tambah retailer
    if (userRole !== 'GM' && userRole !== 'ADMIN_PUSAT') {
      return NextResponse.json({ error: 'Forbidden - Hanya GM yang bisa menambah retailer' }, { status: 403 })
    }

    const body = await req.json()
    const { name, location, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Nama retailer wajib diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('retailer')
      .insert([{
        retailer_name: name,
        location: location || '',
        description: description || '',
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating retailer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      restaurant: {
        id: data.id_retailer,
        name: data.retailer_name,
        code: data.retailer_name.substring(0, 3).toUpperCase(),
        location: data.location,
        description: data.description,
        isActive: data.is_active,
        createdAt: data.created_at
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create restaurant error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update retailer
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userRestaurantId = (session.user as any).restaurantId

    // Hanya GM, ADMIN_PUSAT, atau REGIONAL_MANAGER yang bisa edit
    if (userRole !== 'GM' && userRole !== 'ADMIN_PUSAT' && userRole !== 'REGIONAL_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, location, description, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    // GM/Admin bisa edit semua, Manager hanya bisa edit retailernya sendiri
    if (userRole === 'REGIONAL_MANAGER' && userRestaurantId !== parseInt(id)) {
      return NextResponse.json({ error: 'Forbidden - Hanya bisa edit retailer sendiri' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('retailer')
      .update({
        retailer_name: name,
        location: location || '',
        description: description || '',
        is_active: isActive ?? true
      })
      .eq('id_retailer', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating retailer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      restaurant: {
        id: data.id_retailer,
        name: data.retailer_name,
        code: data.retailer_name.substring(0, 3).toUpperCase(),
        location: data.location,
        description: data.description,
        isActive: data.is_active,
        createdAt: data.created_at
      }
    })

  } catch (error: any) {
    console.error('Update restaurant error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Hapus retailer
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    // Hanya GM yang bisa hapus
    if (userRole !== 'GM' && userRole !== 'ADMIN_PUSAT') {
      return NextResponse.json({ error: 'Forbidden - Hanya GM yang bisa menghapus retailer' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const { error } = await supabase
      .from('retailer')
      .delete()
      .eq('id_retailer', parseInt(id))

    if (error) {
      console.error('Error deleting retailer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Retailer berhasil dihapus' })

  } catch (error: any) {
    console.error('Delete restaurant error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
