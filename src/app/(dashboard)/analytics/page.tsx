'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Clock, AlertTriangle, CheckCircle2, Info, AlertCircle, Upload, Download, RefreshCw, MapPin, CalendarDays, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import * as d3 from 'd3'
import { createPortal } from 'react-dom'

// ==================== TOOLTIP CONTEXT ====================
interface TooltipContextType {
  showTooltip: (content: string, subtext: string, x: number, y: number) => void
  hideTooltip: () => void
}

const TooltipContext = createContext<TooltipContextType | null>(null)

function useTooltipContext() {
  const context = useContext(TooltipContext)
  if (!context) throw new Error('useTooltipContext must be used within TooltipProvider')
  return context
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [tooltip, setTooltip] = useState({ visible: false, content: '', subtext: '', x: 0, y: 0 })
  const showTooltip = useCallback((content: string, subtext: string, x: number, y: number) => {
    setTooltip({ visible: true, content, subtext, x, y })
  }, [])
  const hideTooltip = useCallback(() => setTooltip(prev => ({ ...prev, visible: false })), [])

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {tooltip.visible && typeof document !== 'undefined' && createPortal(
        <div className="fixed z-[99999] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12, transform: 'translate(0, -100%)' }}>
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 max-w-xs">
            <div className="font-semibold text-xs">{tooltip.content}</div>
            {tooltip.subtext && <div className="text-xs text-slate-400 mt-1">{tooltip.subtext}</div>}
            <div className="absolute top-full left-4 -translate-x-1/2 -mt-1">
              <div className="border-8 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </TooltipContext.Provider>
  )
}

// ==================== INTERFACES ====================
interface Restaurant {
  id: string
  name: string
  code: string
}

interface AnalyticsData {
  totalOrders: number
  ordersByRestaurant: { restaurant: string; count: number }[]
  ordersBySize: { size: string; count: number }[]
  ordersByType: { type: string; count: number }[]
  ordersByMonth: { month: string; count: number }[]
  ordersByLocation: { location: string; count: number }[]
  delayStats: { onTime: number; delayed: number; rate: number }
  peakHourStats: { hour: number; count: number }[]
  paymentStats: { method: string; count: number }[]
}

interface FilterState {
  month: string
  pizzaSize: string
  pizzaType: string
  paymentMethod: string
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

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

// ==================== SLICER COMPONENT ====================
function DataSlicer({ 
  filters, 
  setFilters, 
  months,
  pizzaSizes,
  pizzaTypes,
  paymentMethods,
  activeFiltersCount,
  onClearFilters
}: {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  months: string[]
  pizzaSizes: string[]
  pizzaTypes: string[]
  paymentMethods: string[]
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
            <h3 className="font-semibold text-slate-800">Slicer Data (Pemotong Data)</h3>
            <p className="text-xs text-slate-500">Filter data berdasarkan dimensi yang tersedia</p>
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
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Bulan</label>
              <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ukuran Pizza</label>
              <Select value={filters.pizzaSize} onValueChange={(value) => setFilters(prev => ({ ...prev, pizzaSize: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Ukuran" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ukuran</SelectItem>
                  {pizzaSizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Jenis Pizza</label>
              <Select value={filters.pizzaType} onValueChange={(value) => setFilters(prev => ({ ...prev, pizzaType: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {pizzaTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Pembayaran</label>
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Semua Metode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  {paymentMethods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== INTERACTIVE BAR CHART ====================
function InteractiveBarChart({ data, color = COLORS.primary }: { data: { label: string; value: number }[], color?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showTooltip, hideTooltip } = useTooltipContext()
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!containerRef.current || !data.length) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
    const margin = { top: 20, right: 20, bottom: 60, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerWidth]).padding(0.3)
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 0]).nice().range([innerHeight, 0])

    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ''))
      .selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '2,2')
    g.select('.grid').select('.domain').remove()

    const bars = g.selectAll('.bar').data(data).enter().append('rect')
      .attr('class', 'bar').attr('x', d => x(d.label) || 0).attr('width', x.bandwidth())
      .attr('fill', color).attr('rx', 6).style('cursor', 'pointer')

    if (!hasAnimated.current) {
      bars.attr('y', innerHeight).attr('height', 0)
        .transition().duration(800).delay((d, i) => i * 50)
        .attr('y', d => y(d.value)).attr('height', d => innerHeight - y(d.value))
      hasAnimated.current = true
    } else {
      bars.attr('y', d => y(d.value)).attr('height', d => innerHeight - y(d.value))
    }

    g.selectAll('.label').data(data).enter().append('text')
      .attr('class', 'label').attr('x', d => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('font-weight', '600').style('fill', '#475569')
      .style('opacity', 0).text(d => d.value)
      .transition().delay(600).duration(300).style('opacity', 1)

    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x))
      .selectAll('text').attr('fill', '#64748b').style('font-size', '10px')
      .attr('transform', 'rotate(-35)').style('text-anchor', 'end')
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('fill', '#64748b').style('font-size', '10px')

    bars.on('mouseenter', function(event: any, d: any) {
      d3.select(this).attr('opacity', 0.8)
      const percentage = ((d.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)
      showTooltip(`${d.label}: ${d.value}`, `${percentage}% dari total`, event.clientX, event.clientY)
    }).on('mouseleave', function() {
      d3.select(this).attr('opacity', 1)
      hideTooltip()
    })

    return () => { svg.remove() }
  }, [data, color])

  return <div ref={containerRef} className="w-full h-full" />
}

// ==================== INTERACTIVE LINE CHART ====================
function InteractiveLineChart({ data, color = COLORS.primary }: { data: { label: string; value: number }[], color?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showTooltip, hideTooltip } = useTooltipContext()
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!containerRef.current || !data.length) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
    const margin = { top: 20, right: 30, bottom: 60, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Use scaleBand for better label handling with many data points
    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerWidth]).padding(0.1)
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 0]).nice().range([innerHeight, 0])

    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient').attr('id', 'areaGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.25)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0)

    const area = d3.area<{ label: string; value: number }>().x(d => (x(d.label) || 0) + x.bandwidth() / 2).y0(innerHeight).y1(d => y(d.value)).curve(d3.curveMonotoneX)
    g.append('path').datum(data).attr('fill', 'url(#areaGradient)').attr('d', area)

    const line = d3.line<{ label: string; value: number }>().x(d => (x(d.label) || 0) + x.bandwidth() / 2).y(d => y(d.value)).curve(d3.curveMonotoneX)
    const path = g.append('path').datum(data).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 3).attr('d', line)

    if (!hasAnimated.current) {
      const totalLength = path.node()?.getTotalLength() || 0
      path.attr('stroke-dasharray', totalLength + ' ' + totalLength).attr('stroke-dashoffset', totalLength)
        .transition().duration(1500).ease(d3.easeLinear).attr('stroke-dashoffset', 0)
      hasAnimated.current = true
    }

    // Add dots at data points
    g.selectAll('.dot').data(data).enter().append('circle')
      .attr('class', 'dot').attr('cx', d => (x(d.label) || 0) + x.bandwidth() / 2).attr('cy', d => y(d.value))
      .attr('r', 0).attr('fill', color).attr('stroke', 'white').attr('stroke-width', 2).style('cursor', 'pointer')
      .transition().delay((d, i) => i * 80 + 800).duration(300).attr('r', 5)

    // Add X axis with smart label rotation based on data count
    const xAxis = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x))
    
    // Smart label handling - rotate if many labels or long labels
    const shouldRotate = data.length > 6
    xAxis.selectAll('text')
      .attr('fill', '#64748b')
      .style('font-size', shouldRotate ? '10px' : '11px')
      .attr('transform', shouldRotate ? 'rotate(-35)' : 'none')
      .style('text-anchor', shouldRotate ? 'end' : 'middle')
      .each(function() {
        const label = d3.select(this).text()
        if (label.length > 8 && !shouldRotate) {
          d3.select(this).text(label.substring(0, 6) + '...')
        }
      })
    
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('fill', '#64748b').style('font-size', '11px')

    g.selectAll('.dot').on('mouseenter', function(event: any, d: any) {
      d3.select(this).transition().duration(150).attr('r', 8)
      showTooltip(`${d.label}`, `${d.value} pesanan`, event.clientX, event.clientY)
    }).on('mouseleave', function() {
      d3.select(this).transition().duration(150).attr('r', 5)
      hideTooltip()
    })

    return () => { svg.remove() }
  }, [data, color])

  return <div ref={containerRef} className="w-full h-full" />
}

// ==================== INTERACTIVE PIE CHART (FIXED SIZE) ====================
function InteractivePieChart({ data, colors }: { data: { label: string; value: number }[], colors?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showTooltip, hideTooltip } = useTooltipContext()
  const hasAnimated = useRef(false)
  const defaultColors = CHART_COLORS

  useEffect(() => {
    if (!containerRef.current || !data.length) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    // Use full container height for consistent sizing with other charts
    const size = Math.min(width, height) * 0.75
    const radius = size / 2

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`)

    const color = d3.scaleOrdinal<string>().domain(data.map(d => d.label)).range(colors || defaultColors)
    const pie = d3.pie<{ label: string; value: number }>().value(d => d.value).sort(null).padAngle(0.02)
    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>().innerRadius(radius * 0.55).outerRadius(radius)
    const arcHover = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>().innerRadius(radius * 0.55).outerRadius(radius * 1.08)

    const total = data.reduce((a, b) => a + b.value, 0)

    const paths = g.selectAll('.arc').data(pie(data)).enter().append('path')
      .attr('class', 'arc').attr('fill', d => color(d.data.label)).attr('stroke', 'white').attr('stroke-width', 3)
      .style('cursor', 'pointer')

    if (!hasAnimated.current) {
      paths.transition().duration(1000).attrTween('d', function(d) {
        const i = d3.interpolate(d.startAngle + 0.1, d.endAngle)
        return function(t) { d.endAngle = i(t); return arc(d) || '' }
      })
      hasAnimated.current = true
    } else {
      paths.attr('d', arc)
    }

    g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .style('font-size', '16px').style('font-weight', 'bold').style('fill', '#334155')
      .text(total.toLocaleString())
    g.append('text').attr('text-anchor', 'middle').attr('dy', '1.3em')
      .style('font-size', '11px').style('fill', '#64748b').text('Total')

    paths.on('mouseenter', function(event: any, d: any) {
      d3.select(this).transition().duration(200).attrTween('d', function() {
        return function() { return arcHover(d) || '' }
      })
      const percent = ((d.data.value / total) * 100).toFixed(1)
      showTooltip(`${d.data.label}`, `${d.data.value} order (${percent}%)`, event.clientX, event.clientY)
    }).on('mouseleave', function(event: any, d: any) {
      d3.select(this).transition().duration(200).attrTween('d', function() {
        return function() { return arc(d) || '' }
      })
      hideTooltip()
    })

    return () => { svg.remove() }
  }, [data, colors])

  const chartColors = colors || defaultColors

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={containerRef} className="flex-1 min-h-[200px]" />
      <div className="flex flex-wrap justify-center gap-2 px-2">
        {data.slice(0, 6).map((item, i) => (
          <div key={item.label} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
            <span className="text-xs text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== CHART CARD ====================
function ChartCard({ title, description, explanation, insight, recommendation, children }: {
  title: string
  description: string
  explanation?: string
  insight?: string
  recommendation?: string
  children: React.ReactNode
}) {
  const [showInsight, setShowInsight] = React.useState(false)
  const hasInsight = !!(insight || recommendation)
  
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 border-b">
        <div>
          <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[280px] p-4">
        {children}
      </CardContent>
      
      {/* Insight & Rekomendasi - Improved with shadcn style */}
      {hasInsight && (
        <div className="border-t bg-slate-50/50">
          <button 
            onClick={() => setShowInsight(!showInsight)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Insight
              </Badge>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showInsight ? 'rotate-180' : ''}`} />
          </button>
          
          {showInsight && (
            <div className="px-4 pb-4 space-y-3">
              {insight && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
                  </div>
                </div>
              )}
              {recommendation && (
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed">{recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ==================== MAIN ANALYTICS PAGE ====================
export default function AnalyticsPage() {
  return (
    <TooltipProvider>
      <AnalyticsContent />
    </TooltipProvider>
  )
}

function AnalyticsContent() {
  const { data: session, status } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [rawData, setRawData] = useState<AnalyticsData | null>(null)
  const [filteredData, setFilteredData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Separate state for filter options (always shows all available values)
  const [filterOptions, setFilterOptions] = useState<{
    months: string[]
    pizzaSizes: string[]
    pizzaTypes: string[]
    paymentMethods: string[]
  }>({ months: [], pizzaSizes: [], pizzaTypes: [], paymentMethods: [] })
  
  const [filters, setFilters] = useState<FilterState>({
    month: 'all',
    pizzaSize: 'all',
    pizzaType: 'all',
    paymentMethod: 'all'
  })

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userRestaurantId = (session?.user as any)?.restaurantId
  const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isManager = userRole === 'MANAGER'
  const canAccess = isSuperAdmin || isManager

  useEffect(() => {
    if (status === 'authenticated' && canAccess) loadData()
  }, [status, canAccess])

  useEffect(() => {
    if (selectedRestaurant && canAccess) {
      loadAnalytics()
      loadFilterOptions(selectedRestaurant)
    }
  }, [selectedRestaurant])

  // Apply filters when filters change - reload analytics
  useEffect(() => {
    if (selectedRestaurant && canAccess && rawData) {
      loadAnalytics()
    }
  }, [filters])

  const loadData = async () => {
    try {
      const restaurantsRes = await fetch('/api/upload')
      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json()
        setRestaurants(restaurantsData)
        if (userRestaurantId) setSelectedRestaurant(userRestaurantId)
        else if (restaurantsData.length > 0) setSelectedRestaurant(restaurantsData[0].id)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Gagal memuat data')
    }
  }

  // Load filter options when restaurant is selected
  const loadFilterOptions = async (restaurantId: string) => {
    try {
      const params = new URLSearchParams()
      params.set('restaurantId', restaurantId)
      params.set('getFilterOptions', 'true')
      
      const res = await fetch(`/api/analytics?${params.toString()}`)
      if (res.ok) {
        const result = await res.json()
        if (result.filterOptions) {
          setFilterOptions(result.filterOptions)
        }
      }
    } catch (err) {
      console.error('Error loading filter options:', err)
    }
  }

  const loadAnalytics = async () => {
    if (!selectedRestaurant) return
    setIsLoading(true)
    setError(null)
    try {
      // Build query params including filters
      const params = new URLSearchParams()
      params.set('restaurantId', selectedRestaurant)
      
      if (filters.month !== 'all') params.set('month', filters.month)
      if (filters.pizzaSize !== 'all') params.set('pizzaSize', filters.pizzaSize)
      if (filters.pizzaType !== 'all') params.set('pizzaType', filters.pizzaType)
      if (filters.paymentMethod !== 'all') params.set('paymentMethod', filters.paymentMethod)
      
      const res = await fetch(`/api/analytics?${params.toString()}`)
      if (res.ok) {
        const result = await res.json()
        setRawData(result)
        setFilteredData(result)
      } else {
        setError('Gagal memuat analytics')
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    if (!filteredData) return
    const csvData = [
      ['Metrik', 'Nilai'].join(','),
      ['Total Orders', filteredData.totalOrders].join(','),
      ['On Time Rate', filteredData.delayStats.rate].join(','),
      ['Delayed Orders', filteredData.delayStats.delayed].join(','),
      ...filteredData.ordersByMonth.map(d => ['Orders ' + d.month, d.count].join(',')),
      ...filteredData.ordersBySize.map(d => ['Size ' + d.size, d.count].join(',')),
    ].join('\n')
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedRestaurant}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length
  const clearFilters = () => setFilters({ month: 'all', pizzaSize: 'all', pizzaType: 'all', paymentMethod: 'all' })

  // Filter options
  const months = useMemo(() => [...new Set(rawData?.ordersByMonth?.map(o => o.month) || [])].sort(), [rawData])
  const pizzaSizes = useMemo(() => rawData?.ordersBySize?.map(o => o.size) || [], [rawData])
  const pizzaTypes = useMemo(() => rawData?.ordersByType?.map(o => o.type) || [], [rawData])
  const paymentMethods = useMemo(() => rawData?.paymentStats?.map(o => o.method) || [], [rawData])

  const data = filteredData

  if (status === 'loading' || (canAccess && isLoading && !data)) {
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

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-slate-500">{error}</p>
            <Button onClick={loadData} className="mt-4">Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasData = data && (data.totalOrders > 0 || (data.ordersByRestaurant && data.ordersByRestaurant.some((r: any) => r.count > 0)))

  // If no data for selected restaurant but has restaurant comparison data, still show it
  const showRestaurantComparison = data && data.ordersByRestaurant && data.ordersByRestaurant.some((r: any) => r.count > 0)

  if (!hasData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
            <p className="text-slate-500">Analisis data delivery pizza dengan insights actionable</p>
          </div>
          {isSuperAdmin && restaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Pilih restoran" /></SelectTrigger>
              <SelectContent>
                {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-16 w-16 mb-4 opacity-30 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2 text-slate-800">Belum Ada Data</h3>
            <p className="text-center mb-6 max-w-md text-slate-500">Data delivery belum tersedia. Silakan upload data order terlebih dahulu.</p>
            <Link href="/upload" className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <Upload className="w-5 h-5" />
              Upload Data
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getPeakHour = () => {
    if (!data?.peakHourStats?.length) return '-'
    const sorted = [...data.peakHourStats].sort((a, b) => b.count - a.count)
    return sorted[0]?.hour !== undefined ? `${sorted[0].hour}:00` : '-'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
          <p className="text-slate-500">Analisis mendalam data delivery pizza</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && restaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Pilih restoran" /></SelectTrigger>
              <SelectContent>
                {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          
          <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Slicer */}
      <DataSlicer
        filters={filters}
        setFilters={setFilters}
        months={filterOptions.months}
        pizzaSizes={filterOptions.pizzaSizes}
        pizzaTypes={filterOptions.pizzaTypes}
        paymentMethods={filterOptions.paymentMethods}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
      />

      {/* Summary Stats - KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-blue-700">
              <TrendingUp className="w-4 h-4" /> Total Pesanan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800">{data.totalOrders.toLocaleString()}</p>
            <p className="text-xs text-blue-600/70 mt-1">Berdasarkan filter aktif</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Tepat Waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-800">{data.delayStats.rate.toFixed(1)}%</p>
            <p className="text-xs text-emerald-600/70 mt-1">
              {data.delayStats.onTime.toLocaleString()} pesanan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-rose-700">
              <AlertTriangle className="w-4 h-4" /> Terlambat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-800">{data.delayStats.delayed.toLocaleString()}</p>
            <p className="text-xs text-rose-600/70 mt-1">
              {data.totalOrders > 0 ? ((data.delayStats.delayed / data.totalOrders) * 100).toFixed(1) : 0}% dari total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-violet-700">
              <Clock className="w-4 h-4" /> Jam Sibuk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-violet-800">{getPeakHour()}</p>
            <p className="text-xs text-violet-600/70 mt-1">Puncak pesanan</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - Row 1: Trend & Restaurant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Tren Pesanan per Bulan"
          description="Visualisasi tren penjualan pizza dari waktu ke waktu"
          insight={`Bulan ini ada ${data.ordersByMonth[data.ordersByMonth.length - 1]?.count || 0} pesanan. ${data.ordersByMonth.length > 1 ? (data.ordersByMonth[data.ordersByMonth.length - 1].count > data.ordersByMonth[0].count ? 'Tren positif 📈' : 'Tren perlu perhatian 📉') : 'Data belum cukup untuk analisis'}.`}
          recommendation="Pastikan stock bahan baku mencukupi. Pertimbangkan promo pada bulan dengan penjualan rendah."
        >
          <InteractiveLineChart 
            data={data.ordersByMonth.map(d => ({ label: d.month.slice(0, 3), value: d.count }))} 
            color="#f97316"
          />
        </ChartCard>

        {showRestaurantComparison && data.ordersByRestaurant.length > 0 && (
          <ChartCard 
            title="Performa Restoran"
            description="Perbandingan jumlah pesanan antar restoran"
            insight={`Restoran terbaik: ${data.ordersByRestaurant.sort((a, b) => b.count - a.count)[0]?.restaurant || '-'} (${data.ordersByRestaurant.sort((a, b) => b.count - a.count)[0]?.count || 0} pesanan).`}
            recommendation="Evaluasi restoran dengan pesanan rendah dan tiru strategi dari restoran terbaik."
          >
            <InteractiveBarChart 
              data={data.ordersByRestaurant.map(d => ({ label: d.restaurant, value: d.count }))} 
              color="#3b82f6"
            />
          </ChartCard>
        )}
      </div>

      {/* Charts Grid - Row 2: Pizza Stats (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard 
          title="Distribusi Ukuran Pizza"
          description="Preferensi ukuran pizza yang dipesan pelanggan"
          insight={`Ukuran favorit: ${data.ordersBySize[0]?.size || '-'} (${data.ordersBySize[0]?.count || 0} pesanan).`}
          recommendation="Pastikan stock bahan untuk ukuran populer selalu tersedia."
        >
          <InteractivePieChart data={data.ordersBySize.map(d => ({ label: d.size, value: d.count }))} />
        </ChartCard>

        <ChartCard 
          title="Jenis Pizza Populer"
          description="Ranking pizza berdasarkan jumlah pesanan"
          insight={`Terlaris: ${data.ordersByType[0]?.type || '-'}. Tidak laku: ${data.ordersByType[data.ordersByType.length - 1]?.type || '-'}.`}
          recommendation="Fokuskan marketing pada pizza terlaris."
        >
          <InteractivePieChart 
            data={data.ordersByType.map(d => ({ label: d.type, value: d.count }))} 
            colors={['#2563eb', '#7c3aed', '#059669', '#dc2626', '#f59e0b', '#06b6d4']}
          />
        </ChartCard>

        <ChartCard 
          title="Metode Pembayaran"
          description="Preferensi pelanggan dalam metode pembayaran"
          insight={`Paling populer: ${data.paymentStats[0]?.method || '-'}.`}
          recommendation="Pastikan sistem pembayaran utama selalu berjalan lancer."
        >
          <InteractivePieChart 
            data={data.paymentStats.map(d => ({ label: d.method, value: d.count }))} 
            colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
          />
        </ChartCard>
      </div>

      {/* Charts Grid - Row 3: Lokasi Teratas & Jam Sibuk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(data.ordersByLocation.length > 0 || showRestaurantComparison) && (
          <ChartCard 
            title="Lokasi dengan Pesanan Tertinggi"
            description="Area geografis dengan volume pesanan tertinggi"
            insight={`Terbaik: ${data.ordersByLocation[0]?.location || '-'} (${data.ordersByLocation[0]?.count || 0} pesanan).`}
            recommendation="Optimasi rute delivery untuk area tersebut."
          >
            <InteractiveBarChart 
              data={data.ordersByLocation.slice(0, 10).map(d => ({ 
                label: d.location.length > 15 ? d.location.substring(0, 15) + '...' : d.location, 
                value: d.count 
              }))} 
              color="#22c55e"
            />
          </ChartCard>
        )}

        {data.peakHourStats.length > 0 && (
          <ChartCard 
            title="Distribusi Pesanan per Jam"
            description="Analisis jam sibuk dan jam sepi"
            insight={`Jam tersibuk: ${getPeakHour()}. Peak hours menyumbang ~${Math.round((data.peakHourStats.filter(h => (h.hour >= 11 && h.hour <= 13) || (h.hour >= 18 && h.hour <= 21)).reduce((sum, h) => sum + h.count, 0) / data.totalOrders * 100))}% dari total.`}
            recommendation="Tingkatkan staff pada jam sibuk (11-13 & 18-21)."
          >
            <InteractiveBarChart 
              data={data.peakHourStats.map(d => ({ label: `${d.hour}:00`, value: d.count }))} 
              color="#8b5cf6"
            />
          </ChartCard>
        )}
      </div>
    </div>
  )
}

// Helper untuk useMemo
function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  return React.useMemo(factory, deps)
}
