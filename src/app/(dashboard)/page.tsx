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
  ChevronDown,
  Filter,
  Pizza,
  DollarSign,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  avgMargin: number
  ordersByRestaurant: { label: string; value: number }[]
  totalRevenue?: number
  totalProfit?: number
  avgOrderValue?: number
  byCity?: { label: string; value: number }[]
  byState?: { label: string; value: number }[]
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
function InteractiveBarChart({ data, color = COLORS.primary, isCurrency = false }: { data: { label: string; value: number }[], color?: string, isCurrency?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showTooltip, hideTooltip } = useTooltipContext()
  const hasAnimated = useRef(false)

  const formatValue = (value: number, useCurrency?: boolean): string => {
    const isCurr = useCurrency ?? isCurrency
    if (value === undefined || value === null || isNaN(value)) return '0'
    if (isCurr) {
      if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)} M`
      if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} JT`
      if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)} RB`
      return `Rp ${value.toFixed(0)}`
    }
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`
    if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`
    return value.toLocaleString('id-ID')
  }

  useEffect(() => {
    if (!containerRef.current || !data.length) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
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
      .style('font-size', '10px').style('font-weight', '600').style('fill', '#475569')
      .style('opacity', 0).text(d => formatValue(d.value, isCurrency))
      .transition().delay(600).duration(300).style('opacity', 1)

    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x))
      .selectAll('text').attr('fill', '#64748b').style('font-size', '10px')
      .attr('transform', 'rotate(-35)').style('text-anchor', 'end')
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => formatValue(Number(d), isCurrency))).selectAll('text').attr('fill', '#64748b').style('font-size', '10px')

    bars.on('mouseenter', function(event: any, d: any) {
      d3.select(this).attr('opacity', 0.8)
      const percentage = ((d.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)
      const valueStr = formatValue(d.value, true)
      showTooltip(`${d.label}: ${valueStr}`, `${percentage}% dari total`, event.clientX, event.clientY)
    }).on('mouseleave', function() {
      d3.select(this).attr('opacity', 1)
      hideTooltip()
    })

    return () => { svg.remove() }
  }, [data, color, isCurrency])

  return <div ref={containerRef} className="w-full h-full" />
}

// ==================== INTERACTIVE LINE CHART ====================
function InteractiveLineChart({ data, color = COLORS.primary, isCurrency = false }: { data: { label: string; value: number }[], color?: string, isCurrency?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showTooltip, hideTooltip } = useTooltipContext()
  const hasAnimated = useRef(false)

  const formatValue = (value: number, useCurrency?: boolean): string => {
    const isCurr = useCurrency ?? isCurrency
    if (value === undefined || value === null || isNaN(value)) return '0'
    if (isCurr) {
      if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)} M`
      if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} JT`
      if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)} RB`
      return `Rp ${value.toFixed(0)}`
    }
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`
    if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`
    return value.toLocaleString('id-ID')
  }

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
        // Format month labels (2024-01 -> Jan 24)
        if (label.includes('-')) {
          const [year, month] = label.split('-')
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const monthName = monthNames[parseInt(month) - 1] || month
          d3.select(this).text(`${monthName} ${year.slice(2)}`)
        } else if (label.length > 8 && !shouldRotate) {
          d3.select(this).text(label.substring(0, 6) + '...')
        }
      })
    
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => formatValue(Number(d)))).selectAll('text').attr('fill', '#64748b').style('font-size', '11px')

    g.selectAll('.dot').on('mouseenter', function(event: any, d: any) {
      d3.select(this).transition().duration(150).attr('r', 8)
      showTooltip(`${d.label}`, `${formatValue(d.value)}`, event.clientX, event.clientY)
    }).on('mouseleave', function() {
      d3.select(this).transition().duration(150).attr('r', 5)
      hideTooltip()
    })

    return () => { svg.remove() }
  }, [data, color, isCurrency])

  return <div ref={containerRef} className="w-full h-full" />
}

// ==================== INTERACTIVE PIE CHART ====================
function InteractivePieChart({ data, colors }: { data: { label: string; value: number }[], colors?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { showTooltip, hideTooltip } = useTooltipContext()
  const hasAnimated = useRef(false)
  const defaultColors = CHART_COLORS

  const formatValue = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`
    if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`
    return value.toLocaleString('id-ID')
  }

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
      .text(formatValue(total))
    g.append('text').attr('text-anchor', 'middle').attr('dy', '1.3em')
      .style('font-size', '11px').style('fill', '#64748b').text('Total')

    paths.on('mouseenter', function(event: any, d: any) {
      d3.select(this).transition().duration(200).attrTween('d', function() {
        return function() { return arcHover(d) || '' }
      })
      const percent = ((d.data.value / total) * 100).toFixed(1)
      showTooltip(`${d.data.label}`, `${formatValue(d.data.value)} (${percent}%)`, event.clientX, event.clientY)
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
  
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedSize, setSelectedSize] = useState<string>('all')
  const [selectedPizzaType, setSelectedPizzaType] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<string>('all')

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

  const filterData = useCallback((data: { label: string; value: number }[]) => {
    return data
  }, [])

  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)} M`
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} JT`
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)} RB`
    return `Rp ${value.toFixed(0)}`
  }

  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)} RB`
    return value.toLocaleString('id-ID')
  }

  const formatValue = (value: number, isCurrency: boolean = false): string => {
    if (isCurrency) return formatCurrency(value)
    return formatNumber(value)
  }

  const formatCurrencyFull = (value: number): string => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

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
            <h1 className="text-2xl md:text-3xl font-bold">Adidas Sales Dashboard</h1>
            <p className="mt-2 text-xs md:text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Selamat datang, <span className="font-semibold text-white">{userName}</span> - {userRole}
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Belum Ada Data</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Data penjualan Adidas belum tersedia. Silakan upload data penjualan terlebih dahulu.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors">
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
      <div className="text-white p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(79, 70, 229) 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                Adidas Sales Dashboard
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard 
            title="Total Revenue" 
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            isGradient={true}
            subtext="Total pendapatan"
            insight={`Total revenue ${formatCurrencyFull(stats?.totalRevenue || 0)} dalam periode ini.`}
          />

          <KPICard 
            title="Total Units Terjual" 
            value={(stats?.totalOrders || 0).toLocaleString()} 
            icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
            subtext="Total unit terjual"
            insight={`${(stats?.totalOrders || 0).toLocaleString()} unit terjual dalam periode ini.`}
          />

          <KPICard 
            title="Operating Profit" 
            value={formatCurrency(stats?.totalProfit || 0)}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            color="text-green-600"
            bgColor="bg-green-50"
            subtext="Total keuntungan operasi"
            insight={`Total profit ${formatCurrencyFull(stats?.totalProfit || 0)} dengan margin ${(stats?.avgMargin || 0).toFixed(1)}%.`}
          />

          <KPICard 
            title="Rata-rata Order" 
            value={formatCurrency(stats?.avgOrderValue || 0)}
            icon={<MapPin className="w-6 h-6 text-amber-600" />}
            color="text-amber-600"
            bgColor="bg-amber-50"
            subtext="Nilai rata-rata per transaksi"
            insight={`Rata-rata setiap transaksi bernilai ${formatCurrencyFull(stats?.avgOrderValue || 0)}.`}
          />
        </div>

        {/* Charts Grid - Adidas Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Tren Penjualan per Bulan"
            description="Visualisasi total penjualan Adidas per bulan"
            insight={`Total revenue ${formatCurrencyFull(stats?.totalRevenue || 0)} dari ${stats?.deliveryPerformance?.length || 0} bulan. Data menunjukkan tren penjualan per bulan.`}
            recommendation="Rencanakan inventory dan staffing berdasarkan tren penjualan bulanan."
          >
            {stats?.deliveryPerformance?.length ? (
              <InteractiveBarChart data={stats.deliveryPerformance} color={COLORS.primary} isCurrency={true} />
            ) : <EmptyChart message="Belum ada data penjualan" />}
          </ChartCard>

          <ChartCard
            title="Produk Terlaris"
            description="Produk dengan jumlah unit terjual tertinggi"
            insight={`Produk paling banyak terjual: ${stats?.pizzaSizes?.[0]?.label || '-'} dengan ${stats?.pizzaSizes?.[0]?.value || 0} unit. Terdapat ${stats?.pizzaSizes?.length || 0} jenis produk dengan total ${(stats?.pizzaSizes?.reduce((sum, p) => sum + p.value, 0) || 0).toLocaleString()} unit terjual.`}
            recommendation="Pastikan stock untuk produk populer selalu tersedia dan pertimbangkan bundling."
          >
            {stats?.pizzaSizes?.length ? (
              <InteractivePieChart data={stats.pizzaSizes} />
            ) : <EmptyChart message="Belum ada data produk" />}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <ChartCard
            title="Revenue per Produk"
            description="Revenue berdasarkan produk (Top 6)"
            insight={`Produk dengan revenue tertinggi: ${stats?.pizzaTypes?.[0]?.label || '-'} menghasilkan ${formatCurrency(stats?.pizzaTypes?.[0]?.value || 0)}. Total revenue dari semua produk adalah ${formatCurrencyFull(stats?.totalRevenue || 0)}.`}
            recommendation="Fokuskan marketing pada produk dengan revenue tinggi untuk memaksimalkan keuntungan."
          >
            {stats?.pizzaTypes?.length ? (
              <InteractivePieChart data={stats.pizzaTypes.slice(0, 6)} colors={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.danger, COLORS.cyan]} />
            ) : <EmptyChart message="Belum ada data produk" />}
          </ChartCard>

          <ChartCard
            title="Metode Penjualan"
            description="Distribusi metode penjualan yang digunakan"
            insight={`Metode penjualan paling banyak digunakan: ${stats?.paymentMethods?.[0]?.label || '-'} dengan nilai ${formatCurrency(stats?.paymentMethods?.[0]?.value || 0)}. Terdapat ${stats?.paymentMethods?.length || 0} metode penjualan yang digunakan.`}
            recommendation="Pastikan sistem untuk metode utama berjalan lancer dan pertimbangkan insentif untuk metode lain."
          >
            {stats?.paymentMethods?.length ? (
              <InteractivePieChart data={stats.paymentMethods} colors={[COLORS.accent, COLORS.primary, COLORS.warning, COLORS.danger, COLORS.cyan]} />
            ) : <EmptyChart message="Belum ada data metode" />}
          </ChartCard>

          <ChartCard
            title="Top 5 Produk"
            description="Produk dengan volume penjualan tertinggi (Top 5)"
            insight={`Peringkat 1: ${stats?.pizzaSizes?.[0]?.label || '-'} (${stats?.pizzaSizes?.[0]?.value || 0} unit). Top 5 produk menyumbang ${((stats?.pizzaSizes?.slice(0, 5).reduce((sum, p) => sum + p.value, 0) || 0) / (stats?.pizzaSizes?.reduce((sum, p) => sum + p.value, 0) || 1) * 100).toFixed(1)}% dari total penjualan.`}
            recommendation="Pastikan stock untuk 5 produk teratas selalu tersedia."
          >
            {stats?.pizzaSizes?.length ? (
              <InteractiveBarChart data={stats.pizzaSizes.slice(0, 5)} color={COLORS.secondary} />
            ) : <EmptyChart message="Belum ada data produk" />}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ChartCard
            title="Revenue per Kota"
            description="Distribusi revenue berdasarkan kota (Top 10)"
            insight={`Kota dengan revenue tertinggi: ${stats?.byCity?.[0]?.label || '-'} dengan ${formatCurrency(stats?.byCity?.[0]?.value || 0)}. ${stats?.byCity?.length || 0} kota berkontribusi pada total revenue ${formatCurrencyFull(stats?.totalRevenue || 0)}.`}
            recommendation="Fokuskan ekspansi dan marketing di kota-kota dengan potensi tinggi."
          >
            {stats?.byCity?.length ? (
              <InteractiveBarChart data={stats.byCity.slice(0, 10)} color={COLORS.warning} isCurrency={true} />
            ) : <EmptyChart message="Belum ada data kota" />}
          </ChartCard>

          <ChartCard
            title="Revenue per Retailer"
            description="Revenue per retailer (Top 10)"
            insight={`Retailer dengan revenue tertinggi: ${stats?.ordersByRestaurant?.[0]?.label || '-'} dengan ${formatCurrency(stats?.ordersByRestaurant?.[0]?.value || 0)}. ${stats?.ordersByRestaurant?.length || 0} retailer berkontribusi pada penjualan.`}
            recommendation="Evaluasi performa retailer secara berkala dan berikan insentif untuk retailer berprestise."
          >
            {stats?.ordersByRestaurant?.length ? (
              <InteractiveBarChart data={stats.ordersByRestaurant.slice(0, 10)} color={COLORS.accent} isCurrency={true} />
            ) : <EmptyChart message="Belum ada data retailer" />}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
