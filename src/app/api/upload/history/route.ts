import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data: logs, error } = await supabase
      .from('upload_history')
      .select('*')
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

    // Format logs for better display
    const formattedLogs = (logs || []).map(log => ({
      id: log.id_upload,
      fileName: log.file_name,
      systemName: log.system_name,
      status: log.status,
      note: log.note,
      totalRows: log.total_rows,
      uploadedBy: log.uploaded_by,
      uploadedDate: log.uploaded_date,
      formattedDate: new Date(log.uploaded_date).toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    return NextResponse.json({
      success: true,
      logs: formattedLogs
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
