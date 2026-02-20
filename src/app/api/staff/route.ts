import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    
    const isManager = userRole === 'MANAGER'
    const isAsman = userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER'
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let whereClause: any = {}

    // Managers and ASMAN/ASISTEN_MANAGER can see all STAFF and ASISTEN_MANAGER in their restaurant
    if (isManager || isAsman) {
      whereClause = {
        role: { in: ['STAFF', 'ASISTEN_MANAGER'] }
      }
      if (!isSuperAdmin && userRestaurantId) {
        whereClause.restaurantId = userRestaurantId
      }
    } else if (isSuperAdmin) {
      // Super admin can see all
      whereClause = {}
    } else {
      // Regular staff can only see their own data
      whereClause.id = (session.user as any).id
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        isActive: true,
        createdAt: true,
        restaurant: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedStaff = staff.map(s => ({
      ...s,
      restaurantName: s.restaurant?.name,
      restaurantCode: s.restaurant?.code
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

    const isManager = userRole === 'MANAGER'
    const isAsman = userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER'

    if (!isManager && !isAsman) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, position, restaurantId } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    // Determine new staff role and position
    let newStaffRole = 'STAFF'
    let newStaffPosition = 'STAFF'
    
    // MANAGER can create ASISTEN_MANAGER or STAFF (not another MANAGER)
    if (position === 'ASISTEN_MANAGER') {
      if (userRole !== 'MANAGER') {
        return NextResponse.json({ error: 'Tidak berhak membuat akun Asisten Manager' }, { status: 403 })
      }
      newStaffRole = 'ASISTEN_MANAGER'
      newStaffPosition = 'ASISTEN_MANAGER'
    }
    // STAFF is default

    // Use manager's restaurant if not specified
    const targetRestaurantId = restaurantId || userRestaurantId

    const hashedPassword = await bcrypt.hash(password, 10)

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: newStaffRole,
        position: newStaffPosition,
        restaurantId: targetRestaurantId,
        isActive: true
      }
    })

    return NextResponse.json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      position: staff.position,
      isActive: staff.isActive,
      createdAt: staff.createdAt
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

    const isManager = userRole === 'MANAGER'
    const isAsman = userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER'

    if (!isManager && !isAsman) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (toggle === 'true') {
      // Toggle active status
      if (!id) {
        return NextResponse.json({ error: 'Staff ID diperlukan' }, { status: 400 })
      }

      const existingStaff = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingStaff) {
        return NextResponse.json({ error: 'Staff tidak ditemukan' }, { status: 404 })
      }

      // Check if staff belongs to same restaurant
      if (existingStaff.restaurantId !== userRestaurantId && userRole !== 'MANAGER' && userRole !== 'ASMAN' && userRole !== 'ASISTEN_MANAGER') {
        return NextResponse.json({ error: 'Tidak berhak mengubah staff lain' }, { status: 403 })
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !existingStaff.isActive }
      })

      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        position: updated.position,
        isActive: updated.isActive
      })
    }

    // Update staff details
    if (!id) {
      return NextResponse.json({ error: 'Staff ID diperlukan' }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, password, position } = body

    const existingStaff = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff tidak ditemukan' }, { status: 404 })
    }

    // Check if staff belongs to same restaurant
    if (existingStaff.restaurantId !== userRestaurantId && userRole !== 'MANAGER' && userRole !== 'ASMAN' && userRole !== 'ASISTEN_MANAGER') {
      return NextResponse.json({ error: 'Tidak berhak mengubah staff lain' }, { status: 403 })
    }

    const updateData: any = {
      name: name || existingStaff.name,
      email: email || existingStaff.email,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (position && (userRole === 'MANAGER' || userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER')) {
      updateData.role = position
      updateData.position = position
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      position: updated.position,
      isActive: updated.isActive
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

    const isManager = userRole === 'MANAGER'
    const isAsman = userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER'

    if (!isManager && !isAsman) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Staff ID diperlukan' }, { status: 400 })
    }

    const existingStaff = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff tidak ditemukan' }, { status: 404 })
    }

    // Check if staff belongs to same restaurant
    if (existingStaff.restaurantId !== userRestaurantId && userRole !== 'MANAGER' && userRole !== 'ASMAN' && userRole !== 'ASISTEN_MANAGER') {
      return NextResponse.json({ error: 'Tidak berhak menghapus staff lain' }, { status: 403 })
    }

    // Can't delete yourself
    if (existingStaff.email === session.user?.email) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Staff dihapus' })
  } catch (error: any) {
    console.error('Delete staff error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
