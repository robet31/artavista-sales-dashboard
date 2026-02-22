import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, position, restaurantId } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      )
    }

    const validPositions = ['MANAGER', 'REGIONAL_MANAGER', 'STAFF']
    const userPosition = validPositions.includes(position) ? position : 'STAFF'
    const userRole = position === 'MANAGER' ? 'REGIONAL_MANAGER' : (position === 'REGIONAL_MANAGER' ? 'REGIONAL_MANAGER' : 'STAFF')

    // Hash password with MD5
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex')

    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role: userRole,
        position: userPosition,
        restaurant_id: restaurantId ? parseInt(restaurantId) : null,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: { id: data.id, name: data.name, email: data.email, position: data.position }
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
