'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  Trash2,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  PieChart,
  BarChart3,
  Package,
  CreditCard,
  Car,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AIDisplay } from '@/components/ai/ai-display'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface QuestionCategory {
  title: string
  icon: React.ReactNode
  questions: string[]
}

const questionCategories: QuestionCategory[] = [
  {
    title: 'Statistik Umum',
    icon: <BarChart3 className="w-4 h-4" />,
    questions: [
      'Berapa total transaksi bulan ini?',
      'Berapa total revenue bulan ini?',
      'Berapa rata-rata nilai transaksi?',
      'Berapa total profit bulan ini?'
    ]
  },
  {
    title: 'Produk & Penjualan',
    icon: <Package className="w-4 h-4" />,
    questions: [
      'Produk apa yang paling banyak terjual?',
      'Produk apa dengan revenue tertinggi?',
      'Produk apa yang perlu perhatian?',
      'Berapa total unit terjual?'
    ]
  },
  {
    title: 'Retailer & Lokasi',
    icon: <MapPin className="w-4 h-4" />,
    questions: [
      'Retailer mana dengan penjualan tertinggi?',
      'Kota mana dengan transaksi tertinggi?',
      'Region mana yang paling baik?',
      'Retailer mana yang perlu dievaluasi?'
    ]
  },
  {
    title: 'Waktu & Lalu Lintas',
    icon: <Clock className="w-4 h-4" />,
    questions: [
      'Jam berapa paling banyak pesanan?',
      'Kapan waktu transaksi tertinggi?',
      'Bagaimana tren penjualan?'
    ]
  },
  {
    title: 'Pembayaran',
    icon: <CreditCard className="w-4 h-4" />,
    questions: [
      'Metode penjualan apa yang paling sering digunakan?',
      'Metode apa dengan nilai tertinggi?',
      'Metode pembayaran mana yang paling populer?'
    ]
  },
  {
    title: 'Insights & Forecast',
    icon: <TrendingUp className="w-4 h-4" />,
    questions: [
      'Apa insights untuk meningkatkan penjualan?',
      'Prediksi revenue bulan depan?',
      'Bagaimana tren penjualan bulan ini?',
      'Rekomendasi untuk meningkatkan revenue?'
    ]
  }
]

const quickActions = [
  'Ringkasan dashboard',
  'Produk terlaris',
  'Top retailer',
  'Rekomendasi strategis'
]

export default function RecommendationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const allowedRoles = ['GM', 'ADMIN_PUSAT', 'MANAGER']
  
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasData, setHasData] = useState(true)
  const [activeCategory, setActiveCategory] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated' && !allowedRoles.includes(userRole)) router.push('/')
  }, [status, userRole, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError('')
    setQuery('')

    try {
      const response = await fetch('/api/v1/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

        const data = await response.json()

        if (data.answer) {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: data.answer,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        } else if (data.error) {
          throw new Error(data.error + (data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : ''))
        } else if (data.debug && data.debug.summaryCount === 0) {
          throw new Error(`Database tidak memiliki data. Silakan upload data terlebih dahulu.\n\nDebug Info:\n- Summary Count: ${data.debug.summaryCount}\n- Restaurant Count: ${data.debug.restaurantCount}\n- Recent Orders: ${data.debug.recentOrdersCount}`)
        }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Maaf, terjadi kesalahan: ${err.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
  }

  const clearChat = () => {
    setMessages([])
    setError('')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80 text-lg">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-white p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgb(72, 148, 199) 0%, rgb(70, 147, 198) 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                AI Assistant
              </h1>
              <p className="text-xs md:text-base mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Adidas Sales Insights - Analytics & Recommendation
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30">
              <Bot className="w-3 h-3 mr-1" />
              RAG Powered
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Question Categories */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg h-[750px]">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Pertanyaan Sugestif
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[680px]">
                <ScrollArea className="h-full">
                  <div className="px-4 pb-4 space-y-4">
                    
                    {/* Quick Actions */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                        Quick Actions
                      </p>
                      <div className="space-y-1">
                        {quickActions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-2 px-3 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleExampleClick(action)}
                          >
                            <ChevronRight className="w-3 h-3 mr-2 shrink-0" />
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Categories */}
                    {questionCategories.map((category, catIdx) => (
                      <div key={catIdx} className="mb-4">
                        <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                          {category.icon}
                          {category.title}
                        </p>
                        <div className="space-y-1.5">
                          {category.questions.map((question, qIdx) => (
                            <Button
                              key={qIdx}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left h-auto py-2.5 px-3 text-xs text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 whitespace-normal leading-relaxed"
                              onClick={() => {
                                handleExampleClick(question)
                                setActiveCategory(catIdx)
                              }}
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl h-[750px] flex flex-col">
              <CardHeader className="pb-4 border-b bg-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Chat dengan AI
                    <Badge variant="outline" className="ml-2 text-xs">
                      {messages.length} pesan
                    </Badge>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearChat}
                    disabled={messages.length === 0}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 h-[580px] p-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <Bot className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">
                        Selamat Datang di Adidas Sales AI Assistant
                      </h3>
                      <p className="text-slate-500 mb-6 max-w-lg text-sm leading-relaxed">
                        Tanyakan tentang data penjualan Adidas Anda. Saya dapat membantu menganalisis transaksi, retailer, produk populer, forecasting, dan memberikan insights bisnis berbasis AI.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl w-full">
                        <div className="bg-white p-3 rounded-lg border shadow-sm text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-sm text-slate-700">Statistik</span>
                          </div>
                          <p className="text-xs text-slate-500">Lihat ringkasan data</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border shadow-sm text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-sm text-slate-700">Forecasting</span>
                          </div>
                          <p className="text-xs text-slate-500">Prediksi tren</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border shadow-sm text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-purple-500" />
                            <span className="font-medium text-sm text-slate-700">Produk</span>
                          </div>
                          <p className="text-xs text-slate-500">Analisa menu</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border shadow-sm text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            <span className="font-medium text-sm text-slate-700">Revenue</span>
                          </div>
                          <p className="text-xs text-slate-500">Insights bisnis</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.type === 'ai' && (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          )}
                          
                          <div
                            className={`max-w-[85%] px-5 py-4 rounded-2xl ${
                              message.type === 'user'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-md'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                            }`}
                          >
                            {message.type === 'ai' ? (
                              <AIDisplay content={message.content} />
                            ) : (
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </div>
                            )}
                            <div className={`text-xs mt-3 pt-2 border-t ${message.type === 'user' ? 'text-blue-200 border-blue-400/30' : 'text-slate-400 border-slate-100'}`}>
                              {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {message.type === 'user' && (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0 shadow-md">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                            <div className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm shadow-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-xl shrink-0">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ketik pertanyaan Anda..."
                      className="flex-1 h-12 text-sm"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      disabled={!query.trim() || isLoading}
                      className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    AI Assistant menggunakan RAG dengan model OpenRouter untuk menjawab berdasarkan data real-time Anda
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {!hasData && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Belum ada data di database. Silakan upload data terlebih dahulu.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
