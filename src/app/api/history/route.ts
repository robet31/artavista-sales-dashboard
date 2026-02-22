import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Return empty for now - audit logs not implemented in Supabase
    return NextResponse.json([])

  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
