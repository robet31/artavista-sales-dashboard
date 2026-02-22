export interface DataContextConfig {
  name: string
  description: string
  systemPrompt: string
  knowledgeBaseSections: {
    id: string
    title: string
    description: string
  }[]
  dataSource: {
    type: 'supabase' | 'prisma' | 'api'
    tables: {
      transactions: string
      retailers: string
      products: string
      cities: string
      methods: string
    }
  }
  insights: {
    includeForecasting: boolean
    includeAnalytics: boolean
    includeRecommendations: boolean
    visualizationInsights: boolean
  }
  questionCategories: {
    title: string
    icon: string
    questions: string[]
  }[]
  quickActions: string[]
}

export const ADIDAS_RETAIL_CONFIG: DataContextConfig = {
  name: 'Adidas Retail Sales',
  description: 'Data penjualan retail produk Adidas mencakup transaksi, retailer, produk, kota, dan metode penjualan',
  systemPrompt: `Anda adalah asisten AI untuk ADIDAS SALES DASHBOARD.

## KONTEKS:
- Database berisi data penjualan retail produk Adidas dari berbagai retailer di Indonesia
- Data mencakup: transaksi penjualan, retailer, produk, kota, metode penjualan
- Ada juga hasil FORECASTING (prediksi) dan INSIGHTS dari analisis data
- Ada REKOMENDASI bisnis berdasarkan data

## TOPIK YANG BISA DIBANTU:
- 📊 Analisis data penjualan Adidas
- 📈 Tren penjualan per bulan/tahun
- 🏪 Performa retailer
- 📦 Produk paling laris
- 🏙️ Analisis berdasarkan kota/region
- 💳 Metode penjualan
- 🔮 Forecasting dan prediksi
- 💡 Insights dan rekomendasi bisnis
- 📊 Statistik penjualan

## FORMAT:
1. Bahasa Indonesia
2. Markdown formatting
3. Berikan insight bisnis yang berguna`,

  knowledgeBaseSections: [
    { id: 'summary', title: 'Ringkasan Data', description: 'Statistik umum penjualan' },
    { id: 'retailers', title: 'Retailer', description: 'Data retailer dan performanya' },
    { id: 'products', title: 'Produk', description: 'Produk Adidas dan penjualan' },
    { id: 'cities', title: 'Kota & Region', description: 'Analisis geografis' },
    { id: 'methods', title: 'Metode Penjualan', description: 'Cara penjualan' },
    { id: 'insights', title: 'Insights Analytics', description: 'Insight dari visualisasi data' },
    { id: 'recommendations', title: 'Rekomendasi', description: 'Rekomendasi bisnis' },
    { id: 'forecasting', title: 'Forecasting', description: 'Prediksi dan tren' },
    { id: 'transactions', title: 'Transaksi Terbaru', description: 'Data transaksi terakhir' }
  ],

  dataSource: {
    type: 'supabase',
    tables: {
      transactions: 'transaction',
      retailers: 'retailer',
      products: 'product',
      cities: 'city',
      methods: 'method'
    }
  },

  insights: {
    includeForecasting: true,
    includeAnalytics: true,
    includeRecommendations: true,
    visualizationInsights: true
  },

  questionCategories: [
    {
      title: 'Statistik Umum',
      icon: 'BarChart3',
      questions: [
        'Berapa total transaksi bulan ini?',
        'Berapa total revenue bulan ini?',
        'Berapa rata-rata nilai transaksi?',
        'Berapa total profit bulan ini?'
      ]
    },
    {
      title: 'Produk & Penjualan',
      icon: 'Package',
      questions: [
        'Produk apa yang paling banyak terjual?',
        'Produk apa dengan revenue tertinggi?',
        'Produk apa yang perlu perhatian?',
        'Berapa total unit terjual?'
      ]
    },
    {
      title: 'Retailer & Lokasi',
      icon: 'MapPin',
      questions: [
        'Retailer mana dengan penjualan tertinggi?',
        'Kota mana dengan transaksi tertinggi?',
        'Region mana yang paling baik?',
        'Retailer mana yang perlu dievaluasi?'
      ]
    },
    {
      title: 'Waktu & Tren',
      icon: 'Clock',
      questions: [
        'Bulan apa paling tinggi penjualan?',
        'Kapan waktu transaksi tertinggi?',
        'Bagaimana tren penjualan?'
      ]
    },
    {
      title: 'Pembayaran',
      icon: 'CreditCard',
      questions: [
        'Metode penjualan apa yang paling sering digunakan?',
        'Metode apa dengan nilai tertinggi?',
        'Metode pembayaran mana yang paling populer?'
      ]
    },
    {
      title: 'Insights & Forecast',
      icon: 'TrendingUp',
      questions: [
        'Apa insights untuk meningkatkan penjualan?',
        'Prediksi revenue bulan depan?',
        'Bagaimana tren penjualan bulan ini?',
        'Rekomendasi untuk meningkatkan revenue?'
      ]
    }
  ],

  quickActions: [
    'Ringkasan dashboard',
    'Produk terlaris',
    'Top retailer',
    'Rekomendasi strategis'
  ]
}

export const PIZZA_DELIVERY_CONFIG: DataContextConfig = {
  name: 'Pizza Delivery',
  description: 'Data delivery pizza dari berbagai restoran',
  systemPrompt: `Anda adalah asisten AI untuk PIZZA DELIVERY DASHBOARD.

## KONTEKS:
- Database berisi data delivery pizza dari berbagai restoran di Indonesia
- Data mencakup: pesanan, waktu pengiriman, tipe pizza, ukuran, metode pembayaran
- Ada juga hasil FORECASTING (prediksi) dan INSIGHTS dari analisis data
- Ada REKOMENDASI bisnis berdasarkan data

## TOPIK YANG BISA DIBANTU:
- 📊 Analisis data pesanan pizza
- ⏱️ Waktu pengiriman dan faktor keterlambatan
- 🍕 Pizza paling populer
- 🔮 Forecasting dan prediksi
- 💡 Insights dan rekomendasi bisnis
- 📈 Statistik delivery`,

  knowledgeBaseSections: [
    { id: 'summary', title: 'Ringkasan Data', description: 'Statistik umum pesanan' },
    { id: 'restaurants', title: 'Restoran', description: 'Data restoran dan performanya' },
    { id: 'pizzas', title: 'Pizza', description: 'Tipe dan ukuran pizza' },
    { id: 'delivery', title: 'Delivery', description: 'Waktu dan efisiensi pengiriman' },
    { id: 'insights', title: 'Insights', description: 'Insight analytics' },
    { id: 'recommendations', title: 'Rekomendasi', description: 'Rekomendasi bisnis' },
    { id: 'forecasting', title: 'Forecasting', description: 'Prediksi pesanan' }
  ],

  dataSource: {
    type: 'prisma',
    tables: {
      transactions: 'delivery_data',
      retailers: 'restaurant',
      products: 'pizza_type',
      cities: 'location',
      methods: 'payment_method'
    }
  },

  insights: {
    includeForecasting: true,
    includeAnalytics: true,
    includeRecommendations: true,
    visualizationInsights: true
  },

  questionCategories: [
    {
      title: 'Statistik Umum',
      icon: 'BarChart3',
      questions: [
        'Berapa total pesanan?',
        'Berapa revenue hari ini?',
        'Berapa rata-rata waktu pengiriman?'
      ]
    },
    {
      title: 'Pizza & Restoran',
      icon: 'Package',
      questions: [
        'Pizza apa paling populer?',
        'Restoran mana terbaik?',
        'Ukuran apa paling banyak dipesan?'
      ]
    },
    {
      title: 'Delivery',
      icon: 'Car',
      questions: [
        'Berapa tingkat keterlambatan?',
        'Jam sibuk apa?',
        'Bagaimana efisiensi delivery?'
      ]
    },
    {
      title: 'Insights & Forecast',
      icon: 'TrendingUp',
      questions: [
        'Insights untuk improve?',
        'Prediksi pesanan besok?',
        'Rekomendasi bisnis?'
      ]
    }
  ],

  quickActions: [
    'Ringkasan pesanan',
    'Pizza terlaris',
    'Restoran terbaik',
    'Rekomendasi'
  ]
}

export function getConfig(contextType: 'adidas' | 'pizza' = 'adidas'): DataContextConfig {
  switch (contextType) {
    case 'adidas':
      return ADIDAS_RETAIL_CONFIG
    case 'pizza':
      return PIZZA_DELIVERY_CONFIG
    default:
      return ADIDAS_RETAIL_CONFIG
  }
}

export function getContextFromEnv(): 'adidas' | 'pizza' {
  const context = process.env.RAG_CONTEXT_TYPE || 'adidas'
  return context === 'pizza' ? 'pizza' : 'adidas'
}
