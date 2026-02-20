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

    if (userRole === 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(history)

  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
