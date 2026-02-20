'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import { createPortal } from 'react-dom'
import { 
  ShoppingCart, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
  ArrowUpRight,
  Info,
  Loader2,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
interface DashboardStats {
  totalOrders: number
  avgDeliveryTime: number
  delayedOrders: number
  onTimeRate: number
  peakHours: { label: string; value: number }[]
  pizzaSizes: { label: string; value: number }[]
  pizzaTypes: { label: string; value: number }[]
  deliveryPerformance: { label: string; value: number }[]
  trafficImpact: { label: string; value: number }[]
  paymentMethods: { label: string; value: number }[]
  weekendVsWeekday: { weekend: number; weekday: number }
  peakOffPeak: { peak: number; offPeak: number }
  avgDistanceKm: number
  avgDelayMin: number
  ordersByRestaurant: { label: string; value: number }[]
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  cyan: '#06b6d4'
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

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

// ==================== INTERACTIVE PIE CHART ====================
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

// ==================== KPI CARD ====================
function KPICard({ 
  title, 
  value, 
  unit,
  icon, 
  color,
  bgColor = 'bg-slate-50',
  subtext,
  isGradient = false,
  insight
}: { 
  title: string
  value: string
  unit?: string
  icon: React.ReactNode
  color?: string
  bgColor?: string
  subtext?: string
  isGradient?: boolean
  insight?: string
}) {
  return (
    <Card className={`h-full transition-all hover:shadow-md ${isGradient ? 'border-0' : ''}`} style={isGradient ? { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' } : {}}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-xs font-bold ${isGradient ? 'text-blue-200' : 'text-slate-600'}`}>{title}</p>
            <p className={`text-3xl font-bold mt-1 ${isGradient ? 'text-white' : color || 'text-slate-800'}`}>
              {value} 
              {unit && <span className="text-lg font-normal ml-1"> {unit}</span>}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isGradient ? 'bg-white/20' : bgColor}`}>
            {icon}
          </div>
        </div>
        
        {subtext && (
          <p className={`text-xs mt-2 ${isGradient ? 'text-blue-200' : 'text-slate-400'}`}>{subtext}</p>
        )}

        {/* Always show insight if available */}
        {insight && (
          <div className={`mt-3 p-3 rounded-lg text-xs ${isGradient ? 'bg-white/10 text-blue-100' : 'bg-amber-50 text-amber-800 border-l-2 border-amber-400'}`}>
            <span className="font-semibold">💡 {insight}</span>
          </div>
        )}
      </CardContent>
    </Card>
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

// ==================== EMPTY CHART ====================
function EmptyChart({ message = "Belum ada data" }: { message?: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
        <ShoppingCart className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-400 text-xs">{message}</p>
    </div>
  )
}

// ==================== MAIN DASHBOARD PAGE ====================
export default function DashboardPage() {
  return (
    <TooltipProvider>
      <DashboardContent />
    </TooltipProvider>
  )
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userName = session?.user?.name || ''
  const allowedRoles = ['MANAGER', 'GM', 'ADMIN_PUSAT', 'ASMAN', 'ASISTEN_MANAGER', 'STAFF']

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated' && !allowedRoles.includes(userRole)) router.push('/upload')
  }, [status, userRole, router])

  useEffect(() => {
    fetch('/api/dashboard/charts')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  if (status === 'loading' || !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80 text-lg">Memuat Dashboard...</p>
        </div>
      </div>
    )
  }

  const hasData = stats && stats.totalOrders > 0

  if (!hasData && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="text-white p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgb(72, 148, 199) 0%, rgb(70, 147, 198) 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-xs md:text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Selamat datang, <span className="font-semibold text-white">{userName}</span>
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Belum Ada Data</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Data delivery belum tersedia. Silakan upload data order terlebih dahulu.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Upload Data
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-white p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgb(72, 148, 199) 0%, rgb(70, 147, 198) 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                Dashboard
              </h1>
              <p className="mt-2 text-xs md:text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Selamat datang, <span className="font-semibold text-white">{userName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/20 px-4 py-2 rounded-full" style={{ color: 'white' }}>
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard 
            title="Total Pesanan" 
            value={stats?.totalOrders?.toLocaleString() || '0'} 
            icon={<ShoppingCart className="w-6 h-6 text-white" />}
            isGradient={true}
            subtext="Total order dalam periode"
            insight={`Rata-rata ${Math.round((stats?.totalOrders || 0) / 30)} order/hari. Dihitung dari semua pesanan yang masuk ke sistem.`}
          />

          <KPICard 
            title="Tepat Waktu" 
            value={`${(stats?.onTimeRate || 0).toFixed(1)}`} 
            unit="%"
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            color="text-green-600"
            bgColor="bg-green-50"
            subtext={`${stats?.delayedOrders || 0} pesanan terlambat`}
            insight={`On-time rate menunjukkan persentase pesanan yang dikirim tepat waktu. Target industri adalah >85%. Rate saat ini ${(stats?.onTimeRate || 0) >= 85 ? 'sudah baik' : 'perlu ditingkatkan'}.`}
          />

          <KPICard 
            title="Avg. Waktu Kirim" 
            value={(stats?.avgDeliveryTime || 0).toFixed(1)} 
            unit="menit"
            icon={<Clock className="w-6 h-6 text-purple-600" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
            subtext="Rata-rata durasi pengiriman"
            insight={`Waktu rata-rata dari order dibuat hingga pizza sampai di pelanggan. Standar industri adalah 30-45 menit.`}
          />

          <KPICard 
            title="Avg. Jarak" 
            value={(stats?.avgDistanceKm || 0).toFixed(1)} 
            unit="km"
            icon={<MapPin className="w-6 h-6 text-amber-600" />}
            color="text-amber-600"
            bgColor="bg-amber-50"
            subtext="Jarak rata-rata pengiriman"
            insight={`Rata-rata jarak tempuh pengiriman. Jarak mempengaruhi waktu delivery dan biaya operasional.`}
          />
        </div>

        {/* Charts Grid - General Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Tren Pesanan"
            description="Visualisasi tren penjualan pizza dari waktu ke waktu"
            insight={`Total pesanan ${stats?.totalOrders?.toLocaleString()} dengan rata-rata ${Math.round((stats?.totalOrders || 0) / 12)} per bulan.`}
            recommendation="Rencanakan inventory dan staffing berdasarkan tren."
          >
            {stats?.deliveryPerformance?.length ? (
              <InteractiveLineChart data={stats.deliveryPerformance} color={COLORS.primary} />
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard
            title="Performa Restoran"
            description="Perbandingan jumlah pesanan antar restoran"
            insight={`Tertinggi: ${Math.max(...(stats?.ordersByRestaurant?.map(r => r.value) || [0]))} pesanan.`}
            recommendation="Evaluasi restoran dengan performa rendah."
          >
            {stats?.ordersByRestaurant?.length ? (
              <InteractiveBarChart data={stats.ordersByRestaurant} color={COLORS.primary} />
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <ChartCard
            title="Distribusi Ukuran Pizza"
            description="Preferensi ukuran pizza yang dipesan pelanggan"
            insight={`Terpopuler: ${stats?.pizzaSizes?.sort((a, b) => b.value - a.value)[0]?.label || '-'} (${stats?.pizzaSizes?.sort((a, b) => b.value - a.value)[0]?.value || 0} pesanan).`}
            recommendation="Pastikan stock untuk ukuran populer selalu tersedia."
          >
            {stats?.pizzaSizes?.length ? (
              <InteractivePieChart data={stats.pizzaSizes} />
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard
            title="Jenis Pizza Populer"
            description="Ranking pizza berdasarkan jumlah pesanan"
            insight={`Terlaris: ${stats?.pizzaTypes?.sort((a, b) => b.value - a.value)[0]?.label || '-'}.`}
            recommendation="Fokuskan marketing pada pizza terlaris."
          >
            {stats?.pizzaTypes?.length ? (
              <InteractivePieChart data={stats.pizzaTypes} colors={[COLORS.secondary, '#7c3aed', '#059669', '#dc2626', '#f59e0b', '#06b6d4']} />
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard
            title="Metode Pembayaran"
            description="Preferensi pelanggan dalam metode pembayaran"
            insight={`Terpopuler: ${stats?.paymentMethods?.sort((a, b) => b.value - a.value)[0]?.label || '-'} (${((stats?.paymentMethods?.sort((a, b) => b.value - a.value)[0]?.value || 0) / (stats?.totalOrders || 1) * 100).toFixed(1)}%).`}
            recommendation="Pastikan sistem pembayaran utama berjalan lancer."
          >
            {stats?.paymentMethods?.length ? (
              <InteractivePieChart data={stats.paymentMethods} colors={[COLORS.accent, COLORS.primary, COLORS.warning, COLORS.danger, COLORS.cyan]} />
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ChartCard
            title="Jam Sibuk"
            description="Analisis jam dengan volume pesanan tertinggi"
            insight={`Puncak: ${stats?.peakHours?.sort((a, b) => b.value - a.value).slice(0, 3).map(h => h.label).join(', ') || '-'}`}
            recommendation="Tingkatkan staffing pada jam sibuk."
          >
            {stats?.peakHours?.length ? (
              <InteractiveBarChart data={stats.peakHours} color={COLORS.warning} />
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard
            title="Dampak Lalu Lintas"
            description="Pengaruh kondisi lalu lintas terhadap pengiriman"
            insight={`Tertinggi pada: ${stats?.trafficImpact?.sort((a, b) => b.value - a.value)[0]?.label || '-'} traffic.`}
            recommendation="Gunakan untuk estimasi waktu pengiriman yang lebih akurat."
          >
            {stats?.trafficImpact?.length ? (
              <InteractiveBarChart data={stats.trafficImpact} color={COLORS.accent} />
            ) : <EmptyChart />}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
