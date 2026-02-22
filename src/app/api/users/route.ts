import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// GET - List all users (Admin/GM only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    let query = supabase
      .from('app_users')
      .select(`
        *,
        retailer(retailer_name)
      `)
      .order('created_at', { ascending: false })

    if (restaurantId) {
      query = query.eq('restaurant_id', parseInt(restaurantId))
    }

    const { data: users, error } = await query

    if (error) throw error

    const formattedUsers = (users || []).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      position: u.position,
      isActive: u.is_active,
      createdAt: u.created_at,
      lastLogin: u.last_login,
      restaurantId: u.restaurant_id,
      restaurant: u.retailer ? {
        id: u.restaurant_id,
        name: u.retailer.retailer_name,
        code: u.retailer.retailer_name.substring(0, 3).toUpperCase()
      } : null
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new user (Admin/GM only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { email, name, password, role, position, restaurantId, isActive } = body

    if (!email || !name || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Hash password with MD5 (matching the verify function)
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex')

    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        email,
        name,
        password: hashedPassword,
        role,
        position: position || role,
        restaurant_id: restaurantId ? parseInt(restaurantId) : null,
        is_active: isActive !== undefined ? isActive : true
      }])
      .select(`
        *,
        retailer(retailer_name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      position: data.position,
      isActive: data.is_active,
      createdAt: data.created_at,
      restaurantId: data.restaurant_id,
      restaurant: data.retailer ? {
        id: data.restaurant_id,
        name: data.retailer.retailer_name,
        code: data.retailer.retailer_name.substring(0, 3).toUpperCase()
      } : null
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user (Admin/GM only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const body = await req.json()
    const { email, name, password, role, position, restaurantId, isActive } = body

    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) {
      updateData.role = role
      updateData.position = position || role
    }
    if (restaurantId !== undefined) updateData.restaurant_id = restaurantId ? parseInt(restaurantId) : null
    if (isActive !== undefined) updateData.is_active = isActive
    
    if (password && password.length > 0) {
      updateData.password = crypto.createHash('md5').update(password).digest('hex')
    }

    const { data, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        retailer(retailer_name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      position: data.position,
      isActive: data.is_active,
      createdAt: data.created_at,
      lastLogin: data.last_login,
      restaurantId: data.restaurant_id,
      restaurant: data.retailer ? {
        id: data.restaurant_id,
        name: data.retailer.retailer_name,
        code: data.retailer.retailer_name.substring(0, 3).toUpperCase()
      } : null
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete user (Admin/GM only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position
    const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Prevent deleting yourself
    const currentUserId = (session.user as any).id
    if (userId === currentUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
