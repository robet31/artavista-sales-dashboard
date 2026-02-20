'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, History, Calendar, User } from 'lucide-react'

interface HistoryEntry {
  id: string
  action: string
  entity: string
  details: string
  timestamp: Date
  user: {
    name: string
    email: string
  }
}

export default function HistoryPage() {
  const { data: session } = useSession()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    fetchHistory()
    const interval = setInterval(fetchHistory, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (userRole === 'STAFF') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              Anda tidak memiliki akses ke halaman History.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500">Riwayat aktivitas dan perubahan data</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Belum ada aktivitas tercatat.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          entry.action === 'UPLOAD_DATA' 
                            ? 'bg-blue-100 text-blue-700'
                            : entry.action === 'LOGIN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.action}
                        </span>
                        <span className="text-sm text-gray-500">
                          pada {entry.entity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{entry.details}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.timestamp).toLocaleString('id-ID')}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {entry.user.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
