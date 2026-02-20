import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface PizzaDataContext {
  restaurants: any[]
  summary: any
  recentOrders: any[]
  analytics: any
  forecasting: any[]
}

const FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen3-235b-a22b:free', 
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'deepseek/deepseek-r1-0528:free',
  'arcee-ai/trinity-mini:free'
]

const RELIABLE_MODELS = [
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-haiku',
  'meta-llama/llama-3.1-8b-instruct',
  'google/gemma-2-9b-it'
]

async function getPizzaDataContext(): Promise<PizzaDataContext> {
  try {
    console.log('Fetching restaurants...')
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: 'asc' }
    })
    console.log(`Found ${restaurants.length} restaurants`)

    console.log('Fetching delivery data count...')
    const totalCount = await prisma.deliveryData.count()
    console.log('Total delivery data count:', totalCount)

    const summary = await prisma.deliveryData.aggregate({
      _avg: { deliveryDuration: true, delayMin: true, distanceKm: true },
      _sum: { deliveryDuration: true }
    })
    console.log('Summary avg:', summary._avg)

    console.log('Fetching recent orders...')
    const recentOrders = await prisma.deliveryData.findMany({
      take: 100,
      orderBy: { orderTime: 'desc' },
      include: { restaurant: true }
    })
    console.log(`Found ${recentOrders.length} recent orders`)

    console.log('Fetching analytics data...')
    const analytics = await getAnalyticsData()
    console.log('Analytics fetched')
    
    const forecasting = await prisma.forecastResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    console.log(`Found ${forecasting.length} forecast results`)

    return { 
      restaurants, 
      summary: { _count: totalCount, _avg: summary._avg, _sum: summary._sum }, 
      recentOrders, 
      analytics, 
      forecasting 
    }
  } catch (error) {
    console.error('Error in getPizzaDataContext:', error)
    return {
      restaurants: [],
      summary: { _count: 0, _avg: {}, _sum: {} },
      recentOrders: [],
      analytics: {
        ordersByHour: [],
        ordersByMonth: [],
        ordersByPizzaType: [],
        ordersByPizzaSize: [],
        ordersByTraffic: [],
        ordersByPayment: [],
        ordersByRestaurant: [],
        delayedStats: { onTime: 0, delayed: 0 }
      },
      forecasting: []
    }
  }
}

async function getAnalyticsData() {
  try {
    const ordersByHour = await prisma.deliveryData.groupBy({
      by: ['orderHour'],
      _count: true,
      orderBy: { orderHour: 'asc' }
    })

    const ordersByMonth = await prisma.deliveryData.groupBy({
      by: ['orderMonth'],
      _count: true,
      orderBy: { orderMonth: 'desc' },
      take: 12
    })

    const ordersByPizzaType = await prisma.deliveryData.groupBy({
      by: ['pizzaType'],
      _count: true,
      orderBy: { pizzaType: 'desc' },
      take: 10
    })

    const ordersByPizzaSize = await prisma.deliveryData.groupBy({
      by: ['pizzaSize'],
      _count: true,
      orderBy: { pizzaSize: 'desc' }
    })

    const ordersByTraffic = await prisma.deliveryData.groupBy({
      by: ['trafficLevel'],
      _count: true,
      _avg: { delayMin: true }
    })

    const ordersByPayment = await prisma.deliveryData.groupBy({
      by: ['paymentMethod'],
      _count: true,
      orderBy: { paymentMethod: 'desc' }
    })

    const ordersByRestaurant = await prisma.deliveryData.groupBy({
      by: ['restaurantId'],
      _count: true,
      orderBy: { restaurantId: 'desc' },
      take: 10
    })

    const restaurantNames = await prisma.restaurant.findMany({
      where: { id: { in: ordersByRestaurant.map(o => o.restaurantId) } },
      select: { id: true, name: true }
    })
    const restaurantMap = new Map(restaurantNames.map(r => [r.id, r.name]))

    const delayedStats = await prisma.deliveryData.groupBy({
      by: ['isDelayed'],
      _count: true
    })

    return {
      ordersByHour: ordersByHour.map(o => ({ hour: o.orderHour, count: o._count })),
      ordersByMonth: ordersByMonth.map(o => ({ month: o.orderMonth, count: o._count })),
      ordersByPizzaType: ordersByPizzaType.map(o => ({ type: o.pizzaType, count: o._count })).sort((a, b) => b.count - a.count),
      ordersByPizzaSize: ordersByPizzaSize.map(o => ({ size: o.pizzaSize, count: o._count })).sort((a, b) => b.count - a.count),
      ordersByTraffic: ordersByTraffic.map(o => ({ 
        traffic: o.trafficLevel, 
        count: o._count,
        avgDelay: o._avg.delayMin?.toFixed(2) || 0
      })),
      ordersByPayment: ordersByPayment.map(o => ({ method: o.paymentMethod, count: o._count })).sort((a, b) => b.count - a.count),
      ordersByRestaurant: ordersByRestaurant.map(o => ({ 
        restaurant: restaurantMap.get(o.restaurantId) || o.restaurantId, 
        count: o._count 
      })).sort((a, b) => b.count - a.count),
      delayedStats: {
        onTime: delayedStats.find(d => d.isDelayed === false)?._count || 0,
        delayed: delayedStats.find(d => d.isDelayed === true)?._count || 0
      }
    }
  } catch (error) {
    console.error('Error in getAnalyticsData:', error)
    return {
      ordersByHour: [],
      ordersByMonth: [],
      ordersByPizzaType: [],
      ordersByPizzaSize: [],
      ordersByTraffic: [],
      ordersByPayment: [],
      ordersByRestaurant: [],
      delayedStats: { onTime: 0, delayed: 0 }
    }
  }
}

function buildKnowledgeBase(data: PizzaDataContext): string {
  const { restaurants, summary, recentOrders, analytics, forecasting } = data

  let kb = `# Pizza Delivery Dashboard - Knowledge Base\n\n`
  
  kb += `## Ringkasan Data Analytics\n`
  const totalOrders = summary._count || 0
  kb += `- Total Pesanan: ${totalOrders} pesanan\n`
  kb += `- Rata-rata Durasi Pengiriman: ${summary._avg.deliveryDuration?.toFixed(2) || 0} menit\n`
  kb += `- Rata-rata Keterlambatan: ${summary._avg.delayMin?.toFixed(2) || 0} menit\n`
  kb += `- Rata-rata Jarak: ${summary._avg.distanceKm?.toFixed(2) || 0} km\n`
  kb += `- Total Durasi Pengiriman: ${summary._sum.deliveryDuration || 0} menit\n`

  kb += `\n## Performa Pengiriman\n`
  kb += `- Tepat Waktu: ${analytics.delayedStats.onTime} pesanan\n`
  kb += `- Terlambat: ${analytics.delayedStats.delayed} pesanan\n`
  const delayRate = totalOrders > 0 
    ? ((analytics.delayedStats.delayed / totalOrders) * 100).toFixed(2) 
    : 0
  kb += `- Tingkat Keterlambatan: ${delayRate}%\n`

  kb += `\n## Pesanan per Jam\n`
  analytics.ordersByHour.forEach((h: any) => {
    kb += `- Jam ${h.hour}:00 - ${h.count} pesanan\n`
  })

  kb += `\n## Pesanan per Bulan (Terbaru)\n`
  analytics.ordersByMonth.slice(0, 6).forEach((m: any) => {
    kb += `- ${m.month}: ${m.count} pesanan\n`
  })

  kb += `\n## Jenis Pizza Terpopuler\n`
  analytics.ordersByPizzaType.slice(0, 6).forEach((p: any) => {
    kb += `- ${p.type}: ${p.count} pesanan\n`
  })

  kb += `\n## Ukuran Pizza\n`
  analytics.ordersByPizzaSize.forEach((s: any) => {
    kb += `- ${s.size}: ${s.count} pesanan\n`
  })

  kb += `\n## Metode Pembayaran\n`
  analytics.ordersByPayment.forEach((p: any) => {
    kb += `- ${p.method}: ${p.count} pesanan\n`
  })

  kb += `\n## Analisis Lalu Lintas\n`
  analytics.ordersByTraffic.forEach((t: any) => {
    kb += `- ${t.traffic}: ${t.count} pesanan (avg delay: ${t.avgDelay} min)\n`
  })

  kb += `\n## Restoran Paling Aktif\n`
  analytics.ordersByRestaurant.slice(0, 5).forEach((r: any) => {
    kb += `- ${r.restaurant}: ${r.count} pesanan\n`
  })

  kb += `\n## Informasi Restaurant\n`
  restaurants.forEach(r => {
    kb += `- ${r.name} (${r.location || 'N/A'}): ${r.description || 'No description'}\n`
  })

  if (forecasting && forecasting.length > 0) {
    kb += `\n## Hasil Forecasting\n`
    forecasting.forEach(f => {
      try {
        const forecastArr = f.forecastData as any[]
        const method = f.method
        const periods = f.periods
        const name = f.name
        
        kb += `\n### ${name} (Metode: ${method})\n`
        kb += `- Kolom yang diprediksi: ${f.valueColumn || f.dateColumn || 'N/A'}\n`
        kb += `- Periode ke depan: ${periods}\n`
        
        if (Array.isArray(forecastArr) && forecastArr.length > 0) {
          kb += `- Hasil Prediksi:\n`
          forecastArr.slice(0, 7).forEach((val: any, idx: number) => {
            const predValue = typeof val === 'number' ? val.toFixed(2) : JSON.stringify(val)
            kb += `  - Periode ${idx + 1}: ${predValue}\n`
          })
        }
      } catch (err) {
        console.error('Error processing forecast:', err)
      }
    })
  }

  kb += `\n## Data Pesanan Terbaru (Sample)\n`
  recentOrders.slice(0, 30).forEach(order => {
    kb += `- Order ${order.orderId}: ${order.restaurant?.name || 'Unknown'}, ${order.pizzaSize} ${order.pizzaType}, ${order.location}, ${order.deliveryDuration}min, ${order.trafficLevel} traffic, ${order.paymentMethod}, ${order.isDelayed ? 'TERLAMBAT' : 'TEPAT WAKTU'}\n`
  })

  kb += `\n## Pola Umum\n`
  kb += `- Ukuran Pizza: Small, Medium, Large, XL\n`
  kb += `- Jenis Pizza: Veg, Non-Veg, Vegan, Cheese Burst, Supreme, Meat Lovers, Margherita, Pepperoni, Hawaiian, BBQ Chicken, Seafood, Mushroom\n`
  kb += `- Tingkat Lalu Lintas: Low, Medium, High\n`
  kb += `- Metode Pembayaran: Card, Cash, Wallet, UPI\n`
  kb += `- Jam Sibuk: Siang (12-14) dan Malam (18-21)\n`

  return kb
}

async function getAIResponse(query: string, context: string): Promise<{ answer: string, model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey || apiKey === 'sk-or-v1-your-api-key-here') {
    return { 
      answer: `⚠️ **API Key belum dikonfigurasi**

Silakan ikuti langkah berikut untuk mengaktifkan AI Assistant:

1. **Daftar** di https://openrouter.ai
2. **Buat API Key** gratis di https://openrouter.ai/settings/keys
   - Klik "Create Key"
   - Beri nama (misal: "Pizza Dashboard")
   - Untuk limit bisa diisi $0 atau jumlah kecil
3. **Tambahkan ke file .env**:
   \`\`\`
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
   \`\`\`
4. **Restart aplikasi**

---

📚 **Setelah aktif, Anda bisa bertanya:**
- "Berapa total pesanan bulan ini?"
- "Restoran mana yang paling banyak pesanannya?"
- "Pizza apa yang paling populer?"
- "Berapa rata-rata waktu pengiriman?"
- "Apa insights untuk meningkatkan penjualan?"`,
      model: 'none'
    }
  }

  const systemPrompt = `Anda adalah asisten AI yang KHUSUS hanya untuk aplikasi Pizza Delivery Dashboard.

## BATASAN PENTING:
- Anda HANYA boleh menjawab pertanyaan yang BERHUBUNGAN dengan project ini
- Jika pengguna bertanya di luar konteks, TOLAK dengan sopan dan arahkan ke topik yang relevan
- Jangan pernah menjawab pertanyaan umum, politik, religion, atau hal lain yang tidak terkait pizza delivery

## Topik yang BOLEH Anda jawab:
- Data pesanan pizza (orders)
- Restoran pizza
- Menu pizza (ukuran, jenis, topping)
- Pengiriman (delivery, durasi, keterlambatan)
- Pembayaran (cash, card, wallet, UPI)
- Analitik dan statistik delivery
- Forecasting dan prediksi
- Insights bisnis pizza
- Lokasi dan area pengiriman

## Jika ditanya di luar konteks:
Jika pengguna bertanya tentang hal lain, respons dengan:
"Maaf, saya hanya dapat membantu untuk topik yang berkaitan dengan Pizza Delivery Dashboard seperti:
- Data pesanan dan statistik
- Menu dan produk pizza  
- Performa restoran
- Analitik dan forecasting
- Insights bisnis pizza

Silakan bertanya tentang topik di atas ya!"

## Format Respons:
1. **Selalu jawab dalam bahasa Indonesia yang baik dan benar**
2. **Gunakan formatting markdown**:
   - Judul: ## Judul
   - Bold: **text penting**
   - Bullet points: - point 1
3. Jika data tidak tersedia, jelaskan dengan jujur
4. Berikan insight bisnis yang berguna berdasarkan data
5. Pisahkan bagian berbeda dengan baris kosong
6. Gunakan angka/nomor untuk statistik penting
7. Simpan respons agar mudah dibaca

## Knowledge Base:
${context}`

  const allModels = [...FREE_MODELS, ...RELIABLE_MODELS]
  
  let lastError = ''
  
  for (const selectedModel of allModels) {
    try {
      console.log('Trying model:', selectedModel)
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://pizza-dashboard.vercel.app',
          'X-Title': 'Pizza Dashboard RAG'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`
        console.log(`Model ${selectedModel} failed:`, errorMsg)
        lastError = errorMsg
        continue
      }

      const data = await response.json()
      
      if (data.error) {
        console.log(`Model ${selectedModel} returned error:`, data.error)
        lastError = data.error.message
        continue
      }
      
      const answer = data.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat menghasilkan respons.'
      return { answer, model: selectedModel }
    } catch (error: any) {
      console.log(`Model ${selectedModel} exception:`, error.message)
      lastError = error.message
      continue
    }
  }

  return { 
    answer: `⚠️ **Gagal terhubung ke AI**

Semua model AI gagal. Ini bisa disebabkan oleh:
1. **API Key tidak valid** - Silakan cek API key Anda di https://openrouter.ai/settings/credits
2. **Kuota habis** - Isi ulang credits di OpenRouter
3. **Tidak ada koneksi internet**

Error terakhir: ${lastError}

Silakan coba lagi nanti atau hubungi administrator.`,
    model: 'failed'
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any)?.role || (session.user as any)?.position || 'STAFF'
    const allowedRoles = ['GM', 'ADMIN_PUSAT', 'MANAGER']
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Akses hanya untuk GM dan Manager' }, { status: 403 })
    }

    const body = await req.json()
    const { query, action } = body

    if (action === 'history') {
      return NextResponse.json({ history: [] })
    }

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query tidak boleh kosong' }, { status: 400 })
    }

    const pizzaDataContext = await getPizzaDataContext()
    
    console.log('RAG Debug - summary count:', pizzaDataContext.summary._count)
    console.log('RAG Debug - restaurants:', pizzaDataContext.restaurants.length)
    console.log('RAG Debug - recent orders:', pizzaDataContext.recentOrders.length)
    
    // Skip the empty data check - let it run anyway to see actual results
    // if (pizzaDataContext.summary._count === 0) {
    //   return NextResponse.json({
    //     answer: `Belum ada data delivery di database. Silakan upload data terlebih dahulu di halaman Upload Data untuk dapat menggunakan fitur RAG Chat ini.`,
    //     model: 'none',
    //     debug: {
    //       summaryCount: pizzaDataContext.summary._count,
    //       restaurantCount: pizzaDataContext.restaurants.length,
    //       recentOrdersCount: pizzaDataContext.recentOrders.length,
    //       avgDeliveryDuration: pizzaDataContext.summary._avg.deliveryDuration
    //     }
    //   })
    // }

    // Return debug info even if no data
    if (!pizzaDataContext.summary._count || pizzaDataContext.summary._count === 0) {
      return NextResponse.json({
        answer: `DEBUG: Database appears empty. Please check your database connection.\n\nSummary Count: ${pizzaDataContext.summary._count}\nRestaurants: ${pizzaDataContext.restaurants.length}\nRecent Orders: ${pizzaDataContext.recentOrders.length}`,
        model: 'debug',
        debug: {
          summaryCount: pizzaDataContext.summary._count,
          restaurantCount: pizzaDataContext.restaurants.length,
          recentOrdersCount: pizzaDataContext.recentOrders.length
        }
      })
    }

    const knowledgeBase = buildKnowledgeBase(pizzaDataContext)
    const { answer, model } = await getAIResponse(query, knowledgeBase)

    return NextResponse.json({ 
      answer,
      model,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('RAG API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Simple debug - no auth required
    const totalCount = await prisma.deliveryData.count()
    const restaurantCount = await prisma.restaurant.count()
    
    const summary = await prisma.deliveryData.aggregate({
      _avg: { deliveryDuration: true, delayMin: true, distanceKm: true }
    })

    // Get sample data
    const sampleOrders = await prisma.deliveryData.findMany({
      take: 3,
      orderBy: { orderTime: 'desc' }
    })

    return NextResponse.json({ 
      message: 'RAG Debug API',
      database: 'Neon PostgreSQL',
      totalDeliveryData: totalCount,
      totalRestaurants: restaurantCount,
      avgDeliveryDuration: summary._avg.deliveryDuration,
      avgDelay: summary._avg.delayMin,
      sampleOrders: sampleOrders.map(o => ({
        orderId: o.orderId,
        pizzaType: o.pizzaType,
        location: o.location
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
