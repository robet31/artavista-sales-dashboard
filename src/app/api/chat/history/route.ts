import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - Simpan chat history
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { question, answer, type = 'general' } = body

    const userId = session.user?.email || 'unknown'
    const userName = (session.user as any)?.name || session.user?.email || 'Unknown'

    const { data, error } = await supabase
      .from('chat_history')
      .insert([{
        user_id: userId,
        user_name: userName,
        question: question || '',
        answer: answer || '',
        chat_type: type,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error saving chat:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      id: data.id
    }, { status: 201 })

  } catch (error: any) {
    console.error('Save chat error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// GET - Ambil chat history user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user?.email || 'unknown'
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '50'

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      console.error('Error fetching chat:', error)
      return NextResponse.json({ chats: [] })
    }

    return NextResponse.json({ chats: data || [] })

  } catch (error: any) {
    console.error('Get chat error:', error)
    return NextResponse.json({ chats: [], error: error.message }, { status: 500 })
  }
}
