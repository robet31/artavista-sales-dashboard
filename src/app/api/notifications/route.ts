import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET - Ambil notifikasi untuk user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user?.email || 'unknown'

    // Ambil chat history terbaru
    const { data: chats, error: chatError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Konversi chat ke format notifikasi
    const notifications = (chats || []).map((chat, index) => ({
      id: chat.id,
      title: 'Chat Selesai',
      message: chat.question?.substring(0, 50) + '...' || 'Pertanyaan baru',
      type: 'info' as const,
      read: index > 2, // 3 terbaru belum dibaca
      date: formatTimeAgo(chat.created_at),
      chatId: chat.id
    }))

    return NextResponse.json({ notifications })

  } catch (error: any) {
    console.error('Notifications error:', error)
    // Return default notifications jika error
    return NextResponse.json({ 
      notifications: [
        { id: 1, title: 'Selamat Datang', message: 'Gunakan chatbot untuk mendapat insights', type: 'info' as const, read: false, date: 'Baru saja' }
      ] 
    })
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  return `${diffDays} hari lalu`
}

// POST - Tandai notifikasi sudah dibaca
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Untuk saat ini tidak perlu menyimpan read status ke DB
    // Karena notifikasi langsung dari chat history
    
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
