import { supabase } from './supabase'
import { getConfig, getContextFromEnv } from './rag-config'

export interface SalesDataContext {
  summary: any
  retailers: any[]
  products: any[]
  cities: any[]
  methods: any[]
  transactions: any[]
  analytics: any
  forecasting: any
  insights: any
  recommendations: any
  visualizationInsights: any[]
}

export interface VisualizationInsight {
  chartType: string
  title: string
  insight: string
  recommendation: string
}

export async function getAdidasDataContext(): Promise<SalesDataContext> {
  try {
    const config = getConfig(getContextFromEnv())
    console.log('Fetching Adidas data from Supabase...')

    const [transactionsRes, retailersRes, productsRes, methodsRes, citiesRes] = await Promise.all([
      supabase.from('transaction').select('*').limit(10000),
      supabase.from('retailer').select('*').order('retailer_name'),
      supabase.from('product').select('*').order('product'),
      supabase.from('method').select('*').order('method'),
      supabase.from('city').select('*, state(*)').order('city')
    ])

    const transactions = transactionsRes.data || []
    const retailers = retailersRes.data || []
    const products = productsRes.data || []
    const methods = methodsRes.data || []
    const cities = citiesRes.data || []

    console.log(`Found ${transactions.length} transactions, ${retailers.length} retailers`)

    const analytics = generateAnalytics(transactions, retailers, products, methods, cities)
    const insights = generateInsights(analytics, transactions)
    const recommendations = generateRecommendations(analytics, transactions)
    const forecasting = await getForecastingData()
    const visualizationInsights = generateVisualizationInsights(analytics)

    const summary = {
      totalTransactions: transactions.length,
      totalRevenue: analytics.totalRevenue,
      totalProfit: analytics.totalProfit,
      totalUnits: analytics.totalUnits,
      avgOrderValue: analytics.avgOrderValue,
      avgMargin: analytics.avgMargin,
      topProduct: analytics.topProducts[0]?.label || '-',
      topRetailer: analytics.topRetailers[0]?.label || '-',
      topCity: analytics.topCities[0]?.label || '-',
      topMethod: analytics.topMethods[0]?.label || '-',
      bestMonth: analytics.bestMonth?.label || '-'
    }

    return {
      summary,
      retailers,
      products,
      cities,
      methods,
      transactions: transactions.slice(0, 50),
      analytics,
      forecasting,
      insights,
      recommendations,
      visualizationInsights
    }
  } catch (error) {
    console.error('Error in getAdidasDataContext:', error)
    return {
      summary: {},
      retailers: [],
      products: [],
      cities: [],
      methods: [],
      transactions: [],
      analytics: {},
      forecasting: null,
      insights: {},
      recommendations: {},
      visualizationInsights: []
    }
  }
}

function generateAnalytics(transactions: any[], retailers: any[], products: any[], methods: any[], cities: any[]) {
  const byProduct: Record<string, { units: number; revenue: number; profit: number }> = {}
  const byRetailer: Record<string, { units: number; revenue: number; profit: number }> = {}
  const byMethod: Record<string, { units: number; revenue: number; profit: number }> = {}
  const byCity: Record<string, { units: number; revenue: number; profit: number }> = {}
  const byMonth: Record<string, { units: number; revenue: number; profit: number }> = {}

  let totalRevenue = 0
  let totalProfit = 0
  let totalUnits = 0

  for (const t of transactions) {
    const productName = t.product?.product || 'Unknown'
    const retailerName = t.retailer?.retailer_name || 'Unknown'
    const methodName = t.method?.method || 'Unknown'
    const cityName = t.city?.city || 'Unknown'
    const month = t.invoice_date ? t.invoice_date.substring(0, 7) : 'Unknown'

    totalRevenue += t.total_sales || 0
    totalProfit += t.operating_profit || 0
    totalUnits += t.unit_sold || 0

    if (!byProduct[productName]) byProduct[productName] = { units: 0, revenue: 0, profit: 0 }
    byProduct[productName].units += t.unit_sold || 0
    byProduct[productName].revenue += t.total_sales || 0
    byProduct[productName].profit += t.operating_profit || 0

    if (!byRetailer[retailerName]) byRetailer[retailerName] = { units: 0, revenue: 0, profit: 0 }
    byRetailer[retailerName].units += t.unit_sold || 0
    byRetailer[retailerName].revenue += t.total_sales || 0
    byRetailer[retailerName].profit += t.operating_profit || 0

    if (!byMethod[methodName]) byMethod[methodName] = { units: 0, revenue: 0, profit: 0 }
    byMethod[methodName].units += t.unit_sold || 0
    byMethod[methodName].revenue += t.total_sales || 0
    byMethod[methodName].profit += t.operating_profit || 0

    if (!byCity[cityName]) byCity[cityName] = { units: 0, revenue: 0, profit: 0 }
    byCity[cityName].units += t.unit_sold || 0
    byCity[cityName].revenue += t.total_sales || 0
    byCity[cityName].profit += t.operating_profit || 0

    if (!byMonth[month]) byMonth[month] = { units: 0, revenue: 0, profit: 0 }
    byMonth[month].units += t.unit_sold || 0
    byMonth[month].revenue += t.total_sales || 0
    byMonth[month].profit += t.operating_profit || 0
  }

  const topProducts = Object.entries(byProduct)
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const topRetailers = Object.entries(byRetailer)
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const topMethods = Object.entries(byMethod)
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const topCities = Object.entries(byCity)
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const monthlyData = Object.entries(byMonth)
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const bestMonth = monthlyData.length > 0 
    ? monthlyData.reduce((best, current) => current.revenue > best.revenue ? current : best)
    : null

  return {
    totalRevenue,
    totalProfit,
    totalUnits,
    avgOrderValue: totalRevenue / (transactions.length || 1),
    avgMargin: (totalProfit / (totalRevenue || 1)) * 100,
    topProducts,
    topRetailers,
    topMethods,
    topCities,
    monthlyData,
    bestMonth
  }
}

function generateInsights(analytics: any, transactions: any[]): any {
  const insights: string[] = []

  if (analytics.topProducts?.length > 0) {
    const top = analytics.topProducts[0]
    insights.push(`PRODUK TERLARIS: "${top.label}" dengan ${top.units.toLocaleString()} unit terjual dan revenue ${formatCurrency(top.revenue)}`)
  }

  if (analytics.topRetailers?.length > 0) {
    const top = analytics.topRetailers[0]
    insights.push(`RETAILER TERBAIK: "${top.label}" dengan total revenue ${formatCurrency(top.revenue)}`)
  }

  if (analytics.topCities?.length > 0) {
    const top = analytics.topCities[0]
    insights.push(`KOTA TERBAIK: "${top.label}" dengan total revenue ${formatCurrency(top.revenue)}`)
  }

  if (analytics.bestMonth) {
    insights.push(`BULAN TERBAIK: "${analytics.bestMonth.label}" dengan revenue ${formatCurrency(analytics.bestMonth.revenue)}`)
  }

  if (analytics.avgMargin) {
    insights.push(`RATA-RATA MARGIN: ${analytics.avgMargin.toFixed(1)}%`)
  }

  if (analytics.totalRevenue) {
    insights.push(`TOTAL REVENUE: ${formatCurrency(analytics.totalRevenue)}`)
  }

  return { summary: insights }
}

function generateRecommendations(analytics: any, transactions: any[]): any {
  const recommendations: string[] = []

  if (analytics.avgMargin && analytics.avgMargin < 15) {
    recommendations.push('⚠️ MARGIN RENDAH: Margin keuntungan di bawah 15%. Evaluasi biaya operasional dan pricing strategy.')
  }

  if (analytics.topProducts?.length > 0 && analytics.topProducts[0].units < 100) {
    recommendations.push('📦 STOK PRODUK: Beberapa produk memiliki volume penjualan rendah. Evaluasi portofolio produk.')
  }

  if (analytics.topRetailers?.length > 3) {
    const bottomRetailers = analytics.topRetailers.slice(-3).map((r: any) => r.label).join(', ')
    recommendations.push(`🏪 EVALUASI RETAILER: ${bottomRetailers} perlu dievaluasi performanya.`)
  }

  if (analytics.monthlyData?.length > 1) {
    const firstMonth = analytics.monthlyData[0]
    const lastMonth = analytics.monthlyData[analytics.monthlyData.length - 1]
    const growth = ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
    
    if (growth > 10) {
      recommendations.push('📈 TREN POSITIF: Pertumbuhan penjualan bulan ke bulan positif. Pertahankan dan tingkatkan!')
    } else if (growth < -10) {
      recommendations.push('📉 PERINGATAN: Penurunan penjualan signifikan. Segera evaluasi strategi marketing dan produk.')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ KINERJA BAIK: Semua indikator dalam kondisi sehat. Pertahankan performa!')
  }

  return { summary: recommendations }
}

function generateVisualizationInsights(analytics: any): any[] {
  const insights: any[] = []

  if (analytics.bestMonth) {
    insights.push({
      chartType: 'line',
      title: 'Tren Penjualan per Bulan',
      insight: `Bulan dengan penjualan tertinggi: ${analytics.bestMonth.label} dengan revenue ${formatCurrency(analytics.bestMonth.revenue)}`,
      recommendation: 'Pastikan stock barang mencukupi pada bulan-bulan dengan penjualan tinggi. Pertimbangkan promo pada bulan dengan penjualan rendah.'
    })
  }

  if (analytics.topRetailers?.length > 0) {
    const top = analytics.topRetailers[0]
    insights.push({
      chartType: 'bar',
      title: 'Performa Retailer',
      insight: `Retailer terbaik: ${top.label} dengan total revenue ${formatCurrency(top.revenue)} dan ${top.units} unit terjual`,
      recommendation: 'Evaluasi retailer dengan transaksi rendah dan tiru strategi dari retailer terbaik.'
    })
  }

  if (analytics.topProducts?.length > 0) {
    const top = analytics.topProducts[0]
    insights.push({
      chartType: 'pie',
      title: 'Distribusi Produk',
      insight: `Produk paling banyak terjual: ${top.label} dengan ${top.units.toLocaleString()} unit terjual dan revenue ${formatCurrency(top.revenue)}`,
      recommendation: 'Pastikan stock untuk produk terlaris selalu tersedia. Fokuskan marketing pada produk dengan revenue tinggi.'
    })
  }

  if (analytics.topCities?.length > 0) {
    const top = analytics.topCities[0]
    insights.push({
      chartType: 'bar',
      title: 'Top 5 Kota',
      insight: `Kota dengan penjualan tertinggi: ${top.label} dengan total ${formatCurrency(top.revenue)}`,
      recommendation: 'Fokuskan ekspansi dan marketing di kota-kota dengan potensi tinggi.'
    })
  }

  if (analytics.topMethods?.length > 0) {
    const top = analytics.topMethods[0]
    insights.push({
      chartType: 'pie',
      title: 'Metode Penjualan',
      insight: `Metode penjualan paling banyak: ${top.label} dengan ${top.units} transaksi dan revenue ${formatCurrency(top.revenue)}`,
      recommendation: 'Pastikan sistem penjualan utama selalu berjalan lancer. Eksplorasi metode alternatif.'
    })
  }

  if (analytics.monthlyData?.length > 1) {
    const firstMonth = analytics.monthlyData[0]
    const lastMonth = analytics.monthlyData[analytics.monthlyData.length - 1]
    const growth = ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
    
    insights.push({
      chartType: 'line',
      title: 'Tren Pertumbuhan',
      insight: `Pertumbuhan dari ${firstMonth.label} ke ${lastMonth.label}: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
      recommendation: growth > 0 
        ? 'Tren positif! Pertahankan dengan terus meningkatkan kualitas dan pelayanan.'
        : 'Tren menurun. Segera evaluasi strategi marketing, harga, dan kualitas produk.'
    })
  }

  if (analytics.avgMargin) {
    insights.push({
      chartType: 'summary',
      title: 'Ringkasan Keuangan',
      insight: `Total Penjualan: ${formatCurrency(analytics.totalRevenue)} | Total Profit: ${formatCurrency(analytics.totalProfit)} | Rata-rata per transaksi: ${formatCurrency(analytics.avgOrderValue)} | Margin: ${analytics.avgMargin.toFixed(1)}%`,
      recommendation: 'Pantau terus performa keuangan dan pastikan profit margin sehat. Evaluasi biaya operasional jika margin terlalu rendah.'
    })
  }

  return insights
}

async function getForecastingData() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const summaryRes = await fetch(`${appUrl}/api/v1/analytics-data/summary`, {
      next: { revalidate: 0 }
    })
    const summaryData = await summaryRes.json()

    if (!summaryData.success || summaryData.total_orders === 0) {
      return null
    }

    const allDataRes = await fetch(`${appUrl}/api/v1/analytics-data/all-data`, {
      next: { revalidate: 0 }
    })
    const allData = await allDataRes.json()

    if (!allData.data || allData.data.length === 0) {
      return null
    }

    const csvData = convertToCSV(allData.data)
    const formData = new FormData()
    formData.append('file', new Blob([csvData], { type: 'text/csv' }))
    formData.append('date_column', 'invoice_date')
    formData.append('value_column', 'total_sales')
    formData.append('periods', '7')

    const forecastRes = await fetch(`${appUrl}/api/v1/forecasting/exponential-smoothing`, {
      method: 'POST',
      body: formData
    })
    const forecastResult = await forecastRes.json()

    if (forecastResult.historical && forecastResult.forecast) {
      return generateForecastingInsights(forecastResult)
    }

    return null
  } catch (error) {
    console.error('Error fetching forecasting data:', error)
    return null
  }
}

function generateForecastingInsights(forecastResult: any): any {
  const avgHistorical = forecastResult.historical.reduce((a: number, b: {actual: number}) => a + b.actual, 0) / forecastResult.historical.length
  const avgForecast = forecastResult.forecast.reduce((a: number, b: number) => a + b, 0) / forecastResult.forecast.length
  const change = ((avgForecast - avgHistorical) / avgHistorical) * 100
  const lastActual = forecastResult.historical[forecastResult.historical.length - 1]?.actual || 0
  const lastForecast = forecastResult.forecast[forecastResult.forecast.length - 1] || 0
  const lastChange = ((lastForecast - lastActual) / lastActual) * 100

  let trendStatus = 'STABIL'
  if (change > 10) trendStatus = 'NAIK SIGNIFIKAN'
  else if (change > 5) trendStatus = 'NAIK'
  else if (change < -10) trendStatus = 'TURUN SIGNIFIKAN'
  else if (change < -5) trendStatus = 'TURUN'

  const insights: string[] = [
    `📊 Data historis: ${forecastResult.historical.length} periode dengan rata-rata ${formatNumber(avgHistorical)}`,
    `🔮 Hasil prediksi: ${forecastResult.forecast.length} periode ke depan dengan rata-rata ${formatNumber(avgForecast)}`,
    `📈 Perubahan rata-rata: ${change > 0 ? '+' : ''}${change.toFixed(1)}% (${trendStatus})`,
    `📉 Data terakhir: Dari ${formatNumber(lastActual)} → Prediksi ${formatNumber(lastForecast)} (${lastChange > 0 ? '+' : ''}${lastChange.toFixed(1)}%)`
  ]

  let recommendations = ''
  if (change > 20) {
    recommendations = '🚀 BOOST: Prediksi menunjukkan KENAIKAN PENJUALAN signifikan! Segera:\n1. Tambah stok produk\n2. Siapkan inventory tambahan\n3. Pertimbangkan ekspansi\n4. Marketing promo lanjutan!'
  } else if (change > 10) {
    recommendations = '📈 Tren Bagus: Penjualan diprediksi naik. Siapkan:\n1. Inventory yang cukup\n2. Staffing yang memadai\n3. Marketing promo'
  } else if (change < -10) {
    recommendations = '📉 WARNING: Penjualan diprediksi TURUN tajam! Segera:\n1. Evaluasi marketing\n2. Diskon/promo darurat\n3. Survey customer\n4. Cek kompetitor'
  } else if (change < -5) {
    recommendations = '⚠️ Penurunan: Penjualan menurun. Evaluasi:\n1. Strategi promo\n2. Kualitas produk\n3. Service speed'
  } else {
    recommendations = '✅ Stabil: Jumlah penjualan stabil. Jaga:\n1. Konsistensi kualitas\n2. Service excellent\n3. Building customer loyalty'
  }

  return {
    method: forecastResult.method || 'Exponential Smoothing',
    historicalPeriods: forecastResult.historical.length,
    forecastPeriods: forecastResult.forecast.length,
    avgHistorical,
    avgForecast,
    changePercent: change,
    trendStatus,
    lastActual,
    lastForecast,
    lastChangePercent: lastChange,
    insights,
    recommendations
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`
      return val
    })
    csvRows.push(values.join(','))
  }
  return csvRows.join('\n')
}

function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'M'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb'
  return num.toLocaleString('id-ID')
}

function formatCurrency(num: number): string {
  if (num >= 1000000000) return 'Rp ' + (num / 1000000000).toFixed(1) + 'M'
  if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(1) + 'Jt'
  if (num >= 1000) return 'Rp ' + (num / 1000).toFixed(0) + 'Rb'
  return 'Rp ' + num.toLocaleString('id-ID')
}

export function buildKnowledgeBase(data: SalesDataContext): string {
  const { summary, retailers, products, cities, methods, analytics, forecasting, insights, recommendations, transactions, visualizationInsights } = data

  const config = getConfig(getContextFromEnv())
  let kb = `# ${config.name} - Knowledge Base\n\n`
  
  kb += `## RINGKASAN DATA\n`
  kb += `- Total Transaksi: ${summary.totalTransactions?.toLocaleString() || 0}\n`
  kb += `- Total Revenue: ${formatCurrency(summary.totalRevenue || 0)}\n`
  kb += `- Total Profit: ${formatCurrency(summary.totalProfit || 0)}\n`
  kb += `- Total Unit Terjual: ${summary.totalUnits?.toLocaleString() || 0}\n`
  kb += `- Rata-rata Nilai Transaksi: ${formatCurrency(summary.avgOrderValue || 0)}\n`
  kb += `- Rata-rata Margin: ${(summary.avgMargin || 0).toFixed(1)}%\n`
  kb += `- Produk Terlaris: ${summary.topProduct || '-'}\n`
  kb += `- Retailer Terbaik: ${summary.topRetailer || '-'}\n`
  kb += `- Kota Terbaik: ${summary.topCity || '-'}\n`
  kb += `- Metode Utama: ${summary.topMethod || '-'}\n`
  kb += `- Bulan Tertinggi: ${summary.bestMonth || '-'}\n`

  if (insights?.summary) {
    kb += `\n## INSIGHTS ANALYTICS\n`
    insights.summary.forEach((insight: string) => {
      kb += `- ${insight}\n`
    })
  }

  if (recommendations?.summary) {
    kb += `\n## REKOMENDASI BISNIS\n`
    recommendations.summary.forEach((rec: string) => {
      kb += `- ${rec}\n`
    })
  }

  if (visualizationInsights && visualizationInsights.length > 0) {
    kb += `\n## 📊 INSIGHTS VISUALISASI DATA\n`
    visualizationInsights.forEach((vis: any) => {
      kb += `\n### ${vis.title}\n`
      kb += `- Insight: ${vis.insight}\n`
      kb += `- Rekomendasi: ${vis.recommendation}\n`
    })
  }

  if (forecasting) {
    kb += `\n## 🔮 FORECASTING & PREDIKSI\n`
    kb += `- Metode: ${forecasting.method}\n`
    kb += `- Periode Historis: ${forecasting.historicalPeriods} periode\n`
    kb += `- Periode Prediksi: ${forecasting.forecastPeriods} periode ke depan\n`
    kb += `- Rata-rata Historis: ${formatNumber(forecasting.avgHistorical)}\n`
    kb += `- Rata-rata Prediksi: ${formatNumber(forecasting.avgForecast)}\n`
    kb += `- Perubahan: ${forecasting.changePercent > 0 ? '+' : ''}${forecasting.changePercent.toFixed(1)}%\n`
    kb += `- Tren: ${forecasting.trendStatus}\n`
    
    if (forecasting.insights) {
      kb += `\n### Insights Forecasting:\n`
      forecasting.insights.forEach((insight: string) => {
        kb += `- ${insight}\n`
      })
    }
    
    if (forecasting.recommendations) {
      kb += `\n### Rekomendasi Forecasting:\n`
      kb += `${forecasting.recommendations}\n`
    }
  }

  kb += `\n## TOP 10 PRODUK (by Revenue)\n`
  if (analytics.topProducts) {
    analytics.topProducts.slice(0, 10).forEach((p: any, idx: number) => {
      kb += `${idx + 1}. ${p.label}: ${formatCurrency(p.revenue)} (${p.units} unit)\n`
    })
  }

  kb += `\n## TOP 10 RETAILER (by Revenue)\n`
  if (analytics.topRetailers) {
    analytics.topRetailers.slice(0, 10).forEach((r: any, idx: number) => {
      kb += `${idx + 1}. ${r.label}: ${formatCurrency(r.revenue)} (${r.units} unit)\n`
    })
  }

  kb += `\n## TOP 10 KOTA (by Revenue)\n`
  if (analytics.topCities) {
    analytics.topCities.slice(0, 10).forEach((c: any, idx: number) => {
      kb += `${idx + 1}. ${c.label}: ${formatCurrency(c.revenue)} (${c.units} unit)\n`
    })
  }

  kb += `\n## METODE PENJUALAN\n`
  if (analytics.topMethods) {
    analytics.topMethods.forEach((m: any) => {
      kb += `- ${m.label}: ${formatCurrency(m.revenue)} (${m.units} transaksi)\n`
    })
  }

  kb += `\n## TREN BULANAN\n`
  if (analytics.monthlyData) {
    analytics.monthlyData.forEach((m: any) => {
      kb += `- ${m.label}: ${formatCurrency(m.revenue)} (${m.units} unit)\n`
    })
  }

  kb += `\n## DATA TRANSAKSI TERBARU\n`
  transactions?.slice(0, 20).forEach((t: any) => {
    kb += `- ${t.invoice_date}: ${t.product?.product || '-'}, ${t.retailer?.retailer_name || '-'}, ${formatCurrency(t.total_sales)}\n`
  })

  return kb
}
