import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isManager = userRole === 'MANAGER' || userRole === 'REGIONAL_MANAGER'
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let query = supabase
      .from('app_users')
      .select(`
        *,
        retailer(retailer_name)
      `)
      .order('created_at', { ascending: false })

    // Managers can see STAFF in their restaurant
    if (isManager && !isSuperAdmin && userRestaurantId) {
      query = query.eq('restaurant_id', userRestaurantId)
    }

    const { data: staff, error } = await query

    if (error) throw error

    const formattedStaff = (staff || []).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      position: s.position,
      isActive: s.is_active,
      createdAt: s.created_at,
      restaurantName: s.retailer?.retailer_name,
      restaurantCode: s.retailer?.retailer_name?.substring(0, 3).toUpperCase()
    }))

    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error('Get staff error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const userRestaurantId = (session.user as any)?.restaurantId

    const isManager = userRole === 'MANAGER' || userRole === 'REGIONAL_MANAGER'

    if (!isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, position, restaurantId } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
    }

    // Hash password with MD5
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex')

    // Use manager's restaurant if not specified
    const targetRestaurantId = restaurantId ? parseInt(restaurantId) : (userRestaurantId ? parseInt(userRestaurantId) : null)

    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role: 'STAFF',
        position: position || 'STAFF',
        restaurant_id: targetRestaurantId,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      position: data.position,
      isActive: data.is_active,
      createdAt: data.created_at
    })
  } catch (error: any) {
    console.error('Create staff error:', error)
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
    const toggle = searchParams.get('toggle')

    const userRole = (session.user as any).role || (session.user as any).position
    const userRestaurantId = (session.user as any)?.restaurantId

    const isManager = userRole === 'MANAGER' || userRole === 'REGIONAL_MANAGER'

    if (!isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (toggle === 'true') {
      if (!id) {
        return NextResponse.json({ error: 'Staff ID diperlukan' }, { status: 400 })
      }

      // Get current staff
      const { data: existingStaff, error: fetchError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !existingStaff) {
        return NextResponse.json({ error: 'Staff tidak ditemukan' }, { status: 404 })
      }

      // Toggle active status
      const { data, error } = await supabase
        .from('app_users')
        .update({ is_active: !existingStaff.is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        id: data.id,
        name: data.name,
        email: data.email,
        position: data.position,
        isActive: data.is_active
      })
    }

    // Update staff details
    if (!id) {
      return NextResponse.json({ error: 'Staff ID diperlukan' }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, password, position } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (password) {
      updateData.password = crypto.createHash('md5').update(password).digest('hex')
    }
    if (position) {
      updateData.position = position
    }

    const { data, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      position: data.position,
      isActive: data.is_active
    })
  } catch (error: any) {
    console.error('Update staff error:', error)
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

    const userRole = (session.user as any).role || (session.user as any).position
    const userRestaurantId = (session.user as any)?.restaurantId

    const isManager = userRole === 'MANAGER' || userRole === 'REGIONAL_MANAGER'

    if (!isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Staff ID diperlukan' }, { status: 400 })
    }

    // Can't delete yourself
    const currentEmail = session.user?.email
    const { data: existingStaff } = await supabase
      .from('app_users')
      .select('email')
      .eq('id', id)
      .single()

    if (existingStaff?.email === currentEmail) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Staff dihapus' })
  } catch (error: any) {
    console.error('Delete staff error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
