import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data: logs, error } = await supabase
      .from('upload_history')
      .select('id_upload, file_name, system_name, status, note, total_rows, uploaded_by, uploaded_date')
      .order('uploaded_date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: true,
        logs: [],
        message: 'Table may not exist or no data yet'
      })
    }

    return NextResponse.json({
      success: true,
      logs: logs || []
    })
  } catch (error: any) {
    console.error('Upload history error:', error)
    return NextResponse.json({
      success: true,
      logs: [],
      message: error.message || 'No upload history available'
    })
  }
}
