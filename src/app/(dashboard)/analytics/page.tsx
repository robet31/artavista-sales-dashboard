'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Clock, AlertTriangle, CheckCircle2, AlertCircle, Upload, Filter, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { EBarChart, ELineChart, EPieChart } from '@/components/charts/echart-components'

interface Restaurant {
  id: string
  name: string
  code: string
}

interface AnalyticsData {
  totalOrders: number
  ordersByRestaurant: { restaurant: string; count: number; sales?: number }[]
  ordersByProduct: { product: string; count: number; sales?: number }[]
  ordersBySize: { size: string; count: number }[]
  ordersByType: { type: string; count: number }[]
  ordersByMonth: { month: string; count: number; sales?: number }[]
  ordersByLocation: { location: string; count: number; sales?: number }[]
  ordersByMethod: { method: string; count: number; sales?: number }[]
  delayStats: { onTime: number; delayed: number; rate: number }
  peakHourStats: { hour: number; count: number }[]
  paymentStats: { method: string; count: number }[]
  salesStats: { total: number; profit: number; avgOrderValue: number }
}

interface FilterState {
  month: string
  product: string
  city: string
  method: string
}

interface FilterOptions {
  retailers: { id_retailer: number; retailer_name: string }[]
  products: { id_product: number; product: string }[]
  methods: { id_method: number; method: string }[]
  cities: { id_city: number; city: string }[]
  months: string[]
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  pink: '#ec4899',
  purple: '#8b5cf6',
  cyan: '#06b6d4'
}

function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' M'
  else if (num >= 1000000) return (num / 1000000).toFixed(1) + ' JT'
  else if (num >= 1000) return (num / 1000).toFixed(0) + ' RB'
  return num.toLocaleString('id-ID')
}

function formatCurrency(num: number): string {
  if (num >= 1000000000) return 'Rp ' + (num / 1000000000).toFixed(1) + ' M'
  else if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(1) + ' JT'
  else if (num >= 1000) return 'Rp ' + (num / 1000).toFixed(0) + ' RB'
  return 'Rp ' + num.toLocaleString('id-ID')
}

function DataSlicer({ 
  filters, 
  setFilters, 
  filterOptions,
  activeFiltersCount,
  onClearFilters
}: {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  filterOptions: FilterOptions
  activeFiltersCount: number
  onClearFilters: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div 
        className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Filter Data</h3>
            <p className="text-xs text-slate-500">Filter data untuk analisis yang lebih spesifik</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {activeFiltersCount} filter aktif
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClearFilters()
            }}
            disabled={activeFiltersCount === 0}
          >
            Reset
          </Button>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Bulan Transaksi</label>
              <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {filterOptions.months?.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Produk</label>
              <Select value={filters.product} onValueChange={(value) => setFilters(prev => ({ ...prev, product: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Produk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {filterOptions.products?.map(p => <SelectItem key={p.id_product} value={p.product}>{p.product}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kota</label>
              <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Kota" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kota</SelectItem>
                  {filterOptions.cities?.map(c => <SelectItem key={c.id_city} value={c.city}>{c.city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Metode Penjualan</label>
              <Select value={filters.method} onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Metode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  {filterOptions.methods?.map(m => <SelectItem key={m.id_method} value={m.method}>{m.method}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, description, children, insight, recommendation }: {
  title: string
  description: string
  children: React.ReactNode
  insight?: string
  recommendation?: string
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const hasContent = insight || recommendation

  return (
    <Card className="h-full flex flex-col overflow-hidden relative">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
            <CardDescription className="text-sm text-slate-500 mt-1">{description}</CardDescription>
          </div>
          {hasContent && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="text-xs font-medium">Insight</span>
                {showDropdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-4">
                  {insight && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Insight</p>
                      <p className="text-sm text-slate-700">{insight}</p>
                    </div>
                  )}
                  {recommendation && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Rekomendasi</p>
                      <p className="text-sm text-slate-700">{recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[280px] p-4">
        {children}
      </CardContent>
    </Card>
  )
}

function EmptyChart({ message = "Belum ada data" }: { message?: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
        <TrendingUp className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-400 text-xs">{message}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [filteredData, setFilteredData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ retailers: [], products: [], methods: [], cities: [], months: [] })
  
  const [filters, setFilters] = useState<FilterState>({
    month: 'all',
    product: 'all',
    city: 'all',
    method: 'all'
  })

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userRestaurantId = (session?.user as any)?.restaurantId
  const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isManager = userRole === 'MANAGER'
  const canAccess = isSuperAdmin || isManager

  useEffect(() => {
    if (status === 'authenticated' && canAccess) {
      loadInitialData()
    }
  }, [status, canAccess])

  useEffect(() => {
    if (canAccess && selectedRestaurant) {
      loadAnalytics()
    }
  }, [selectedRestaurant, filters])

  const loadInitialData = async () => {
    try {
      const [restaurantsRes, filterRes] = await Promise.all([
        fetch('/api/restaurants'),
        fetch('/api/dashboard/filter-options')
      ])
      
      if (restaurantsRes.ok) {
        const data = await restaurantsRes.json()
        const rawRestaurants = data.restaurants || data || []
        const formattedRestaurants = rawRestaurants.map((r: any) => ({
          id: r.id_retailer || r.id,
          name: r.retailer_name || r.name,
          code: r.retailer_name?.substring(0, 3).toUpperCase() || r.code
        }))
        setRestaurants(formattedRestaurants)
        if (formattedRestaurants.length > 0) {
          setSelectedRestaurant('all')
        }
      }

      if (filterRes.ok) {
        const filterData = await filterRes.json()
        setFilterOptions(filterData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const loadAnalytics = async () => {
    if (!selectedRestaurant) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedRestaurant !== 'all') params.set('retailer', selectedRestaurant)
      if (filters.month !== 'all') params.set('month', filters.month)
      if (filters.product !== 'all') params.set('product', filters.product)
      if (filters.city !== 'all') params.set('city', filters.city)
      if (filters.method !== 'all') params.set('method', filters.method)
      
      const res = await fetch(`/api/dashboard/charts?${params.toString()}`)
      const data = await res.json()
      
      if (data.totalOrders > 0 || (data.ordersByRestaurant && data.ordersByRestaurant.some((r: any) => r.value > 0))) {
        const analyticsData: AnalyticsData = {
          totalOrders: data.totalOrders,
          ordersByRestaurant: data.ordersByRestaurant || [],
          ordersByProduct: data.pizzaTypes?.map((p: any) => ({ product: p.label, count: p.value, sales: p.value })) || [],
          ordersBySize: data.pizzaSizes || [],
          ordersByType: data.pizzaTypes?.slice(0, 5) || [],
          ordersByMonth: data.deliveryPerformance?.map((d: any) => ({ month: d.label, count: d.value, sales: d.value })) || [],
          ordersByLocation: data.byCity?.map((c: any) => ({ location: c.label, count: c.value, sales: c.value })) || [],
          ordersByMethod: data.paymentMethods?.map((m: any) => ({ method: m.label, count: m.value })) || [],
          delayStats: { onTime: 0, delayed: 0, rate: 0 },
          peakHourStats: data.peakHours?.map((h: any, i: number) => ({ hour: i, count: h.value })) || [],
          paymentStats: data.paymentMethods || [],
          salesStats: { 
            total: data.totalRevenue || 0, 
            profit: data.totalProfit || 0, 
            avgOrderValue: data.avgOrderValue || 0 
          }
        }
        setFilteredData(analyticsData)
      } else {
        setFilteredData(null)
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length
  const clearFilters = () => setFilters({ month: 'all', product: 'all', city: 'all', method: 'all' })

  if (status === 'loading' || (canAccess && isLoading && !filteredData)) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Anda tidak memiliki akses ke halaman Analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasData = filteredData && filteredData.totalOrders > 0

  if (!hasData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
            <p className="text-slate-500">Analisis data penjualan Adidas dengan insights actionable</p>
          </div>
          {isSuperAdmin && restaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Pilih retailer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Retail</SelectItem>
                {restaurants?.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Filter tetap visible meskipun tidak ada data */}
        <DataSlicer
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={clearFilters}
        />
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-16 w-16 mb-4 opacity-30 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2 text-slate-800">Belum Ada Data</h3>
            <p className="text-center mb-6 max-w-md text-slate-500">Data penjualan belum tersedia untuk filter yang dipilih. Silakan pilih filter lain atau upload data transaksi terlebih dahulu.</p>
            <Link href="/upload" className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <Upload className="w-5 h-5" />
              Upload Data
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = filteredData

  const getTotalRevenue = () => {
    return data.ordersByMonth?.reduce((sum: number, m: any) => sum + (m.sales || 0), 0) || 0
  }

  const getTotalProfit = () => {
    return data.ordersByProduct?.reduce((sum: number, p: any) => sum + (p.sales || 0), 0) || 0
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
          <p className="text-slate-500">Analisis mendalam data penjualan Adidas</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && restaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Pilih retailer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Retail</SelectItem>
                {restaurants?.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Data Slicer */}
      <DataSlicer
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
      />

      {/* Summary Stats - KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-blue-700">
              <TrendingUp className="w-4 h-4" /> Total Transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800">{formatNumber(data.totalOrders)}</p>
            <p className="text-xs text-blue-600/70 mt-1">Unit terjual</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-800">{formatCurrency(getTotalRevenue())}</p>
            <p className="text-xs text-emerald-600/70 mt-1">Total penjualan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-rose-700">
              <AlertTriangle className="w-4 h-4" /> Total Profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-800">{formatCurrency(getTotalProfit())}</p>
            <p className="text-xs text-rose-600/70 mt-1">Estimasi keuntungan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-violet-700">
              <Clock className="w-4 h-4" /> Rata-rata Order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-violet-800">{formatCurrency(data.salesStats?.avgOrderValue || 0)}</p>
            <p className="text-xs text-violet-600/70 mt-1">Per transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - Row 1: Trend & Restaurant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Tren Penjualan per Bulan"
          description="Visualisasi total penjualan (dalam Rupiah) Adidas dari waktu ke waktu"
          insight={data.ordersByMonth && data.ordersByMonth.length > 0 ? `Total revenue: ${formatCurrency(data.ordersByMonth.reduce((s: number, m: any) => s + (m.sales || 0), 0))}` : undefined}
          recommendation="Pastikan stock mencukupi pada bulan dengan penjualan tinggi. Pertimbangkan promo pada bulan dengan penjualan rendah."
        >
          {data.ordersByMonth && data.ordersByMonth.length > 0 ? (
            <ELineChart 
              data={data.ordersByMonth.map(d => ({ label: d.month.slice(0, 7), value: d.sales || 0 }))} 
              color="#f97316"
              isCurrency={true}
              height={280}
            />
          ) : <EmptyChart message="Belum ada data" />}
        </ChartCard>

        {data.ordersByRestaurant && data.ordersByRestaurant.length > 0 && (
          <ChartCard 
            title="Performa Retailer"
            description="Perbandingan jumlah transaksi antar retailer"
            insight={`Retailer terbaik: ${data.ordersByRestaurant[0]?.restaurant || '-'}`}
            recommendation="Evaluasi retailer dengan transaksi rendah dan tiru strategi dari retailer terbaik."
          >
            <EBarChart 
              data={data.ordersByRestaurant.map(d => ({ label: d.restaurant, value: d.sales || 0 }))} 
              color="#3b82f6"
              isCurrency={true}
              height={280}
            />
          </ChartCard>
        )}
      </div>

      {/* Charts Grid - Row 2: Product Stats (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard 
          title="Distribusi Produk"
          description="Jumlah unit terjual berdasarkan produk"
          insight={data.ordersByProduct && data.ordersByProduct.length > 0 ? `Produk paling laris: ${data.ordersByProduct[0]?.product || '-'}` : undefined}
          recommendation="Pastikan stock produk terlaris selalu tersedia."
        >
          {data.ordersByProduct && data.ordersByProduct.length > 0 ? (
            <EPieChart data={data.ordersByProduct.map(d => ({ label: d.product, value: d.count }))} height={280} />
          ) : <EmptyChart message="Belum ada data" />}
        </ChartCard>

        <ChartCard 
          title="Produk Terlaris (Revenue)"
          description="Produk dengan revenue tertinggi"
          insight={data.ordersByProduct && data.ordersByProduct.length > 0 ? `Revenue tertinggi: ${data.ordersByProduct[0]?.product || '-'}` : undefined}
          recommendation="Fokuskan marketing pada produk dengan revenue tinggi."
        >
          {data.ordersByProduct && data.ordersByProduct.length > 0 ? (
            <EPieChart 
              data={data.ordersByProduct.slice(0, 5).map(d => ({ label: d.product, value: d.sales || 0 }))} 
              colors={['#2563eb', '#7c3aed', '#059669', '#dc2626', '#f59e0b', '#06b6d4']}
              height={280}
              isCurrency={true}
            />
          ) : <EmptyChart message="Belum ada data" />}
        </ChartCard>

        <ChartCard 
          title="Top 5 Kota"
          description="Kota dengan penjualan tertinggi"
          insight={data.ordersByLocation && data.ordersByLocation.length > 0 ? `Kota terbaik: ${data.ordersByLocation[0]?.location || '-'}` : undefined}
          recommendation="Fokuskan ekspansi di kota-kota dengan potensi tinggi."
        >
          {data.ordersByLocation && data.ordersByLocation.length > 0 ? (
            <EBarChart 
              data={data.ordersByLocation.slice(0, 5).map(d => ({ 
                label: d.location?.length > 12 ? d.location.substring(0, 12) + '...' : d.location, 
                value: d.sales || 0
              }))} 
              color="#22c55e"
              isCurrency={true}
              height={280}
            />
          ) : <EmptyChart message="Belum ada data" />}
        </ChartCard>
      </div>

      {/* Charts Grid - Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.ordersByLocation && data.ordersByLocation.length > 0 && (
          <ChartCard 
            title="Kota dengan Transaksi Tertinggi"
            description="Area geografis dengan volume transaksi tertinggi"
            insight={`Total ${data.ordersByLocation.reduce((s: number, c: any) => s + c.count, 0)} transaksi`}
            recommendation="Analisa pola transaksi per kota untuk strategi yang lebih baik."
          >
            <EBarChart 
              data={data.ordersByLocation.slice(0, 10).map(d => ({ 
                label: d.location?.length > 15 ? d.location.substring(0, 15) + '...' : d.location, 
                value: d.count 
              }))} 
              color="#22c55e"
              height={280}
            />
          </ChartCard>
        )}

        {data.ordersByMethod && data.ordersByMethod.length > 0 && (
          <ChartCard 
            title="Metode Penjualan"
            description="Distribusi berdasarkan cara penjualan"
            insight={data.ordersByMethod.length > 0 ? `Metode paling banyak: ${data.ordersByMethod[0]?.method || '-'}` : undefined}
            recommendation="Pastikan sistem penjualan utama berjalan lancer. Eksplorasi metode alternatif."
          >
            <EPieChart 
              data={data.ordersByMethod.map(d => ({ label: d.method, value: d.count }))} 
              colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
              height={280}
            />
          </ChartCard>
        )}
      </div>
    </div>
  )
}
