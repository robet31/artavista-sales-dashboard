import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    if (userRole !== 'GM' && userRole !== 'ADMIN_PUSAT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(restaurants)

  } catch (error) {
    console.error('Restaurants error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
