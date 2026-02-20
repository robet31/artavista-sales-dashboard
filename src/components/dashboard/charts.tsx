'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface ChartProps {
  data: any[]
}

export function OrdersLineChart({ data }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 300
    const margin = { top: 25, right: 30, bottom: 40, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scalePoint()
      .domain(data.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.6)

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.count) || 0) * 1.25])
      .range([innerHeight, 0])

    const defs = svg.append('defs')

    // Animated gradient
    const lineGradient = defs.append('linearGradient')
      .attr('id', 'animatedLineGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0).attr('x2', innerWidth).attr('y2', 0)
    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6')
    lineGradient.append('stop').attr('offset', '50%').attr('stop-color', '#8b5cf6')
    lineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ec4899')

    const areaGradient = defs.append('linearGradient')
      .attr('id', 'animatedAreaGradient')
      .attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1)
    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.35)
    areaGradient.append('stop').attr('offset', '50%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.15)
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ec4899').attr('stop-opacity', 0.02)

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glowEffect')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = glow.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Grid with gradient
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '6,4')
    g.selectAll('.grid .domain').remove()

    // X Axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
    xAxis.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('dy', '1em')
    xAxis.select('.domain').attr('stroke', '#e2e8f0')
    xAxis.selectAll('.tick line').attr('stroke', '#e2e8f0')

    // Y Axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => d3.format(',.0f')(d as number)))
    yAxis.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '12px')
    yAxis.select('.domain').attr('stroke', '#e2e8f0')
    yAxis.selectAll('.tick line').remove()

    // Area with animation
    const area = d3.area<any>()
      .x(d => x(d.month) || 0)
      .y0(innerHeight)
      .y1(d => y(d.count))
      .curve(d3.curveCatmullRom.alpha(0.6))

    const areaPath = g.append('path')
      .datum(data)
      .attr('fill', 'url(#animatedAreaGradient)')
      .attr('d', area)
      .attr('opacity', 0)

    areaPath.transition()
      .duration(1200)
      .attr('opacity', 1)

    // Line with animation
    const line = d3.line<any>()
      .x(d => x(d.month) || 0)
      .y(d => y(d.count))
      .curve(d3.curveCatmullRom.alpha(0.6))

    const linePath = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'url(#animatedLineGradient)')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line)
      .style('filter', 'url(#glowEffect)')

    const totalLength = linePath.node()?.getTotalLength() || 0
    linePath
      .attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeQuadInOut)
      .attr('stroke-dashoffset', 0)

    // Animated dots
    const dots = g.selectAll('.animated-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'animated-dot')
      .attr('cx', d => x(d.month) || 0)
      .attr('cy', d => y(d.count))
      .attr('r', 0)
      .attr('fill', '#fff')
      .attr('stroke', '#ec4899')
      .attr('stroke-width', 3)
      .style('filter', 'url(#glowEffect)')

    dots.transition()
      .delay((d, i) => 1500 + i * 150)
      .duration(400)
      .attr('r', 7)

    // Value labels
    const labels = g.selectAll('.animated-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'animated-label')
      .attr('x', d => x(d.month) || 0)
      .attr('y', d => y(d.count) - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1e293b')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('opacity', 0)
      .text(d => d.count.toLocaleString())

    labels.transition()
      .delay((d, i) => 1800 + i * 100)
      .duration(300)
      .attr('opacity', 1)

  }, [data])

  return <svg ref={svgRef}></svg>
}

export function PizzaSizeChart({ data }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 260
    const height = 220
    const radius = Math.min(width, height) / 2 - 20
    const innerRadius = radius * 0.5

    const g = svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const colors = ['#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']
    const total = d3.sum(data, d => d.count)

    const defs = svg.append('defs')

    // Drop shadow
    const dropShadow = defs.append('filter').attr('id', 'pieDropShadow')
    dropShadow.append('feDropShadow').attr('dx', 0).attr('dy', 4).attr('stdDeviation', 6).attr('flood-opacity', 0.12)

    // Hover effect filter
    const hoverGlow = defs.append('filter').attr('id', 'pieHoverGlow')
    hoverGlow.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'coloredBlur')
    const pieHoverMerge = hoverGlow.append('feMerge')
    pieHoverMerge.append('feMergeNode').attr('in', 'coloredBlur')
    pieHoverMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null)
      .padAngle(0.02)

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6)

    const arcHover = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8)
      .cornerRadius(6)

    const arcs = g.selectAll('.pie-arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'pie-arc')

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colors[i % colors.length])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5)
      .style('filter', 'url(#pieDropShadow)')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover)
          .style('filter', 'url(#pieHoverGlow)')
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
          .style('filter', 'url(#pieDropShadow)')
      })
      .transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return (t) => arc(interpolate(t)) || ''
      })

    // Center with animation
    const centerGroup = g.append('g').attr('class', 'center-text')

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('font-size', '28px')
      .attr('font-weight', '800')
      .attr('fill', '#1e293b')
      .text(total.toLocaleString())
      .attr('opacity', 0)
      .transition()
      .delay(800)
      .duration(400)
      .attr('opacity', 1)

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('font-size', '12px')
      .attr('fill', '#64748b')
      .attr('font-weight', '500')
      .text('TOTAL')
      .attr('opacity', 0)
      .transition()
      .delay(900)
      .duration(400)
      .attr('opacity', 1)

  }, [data])

  return <svg ref={svgRef}></svg>
}

export function DeliveryPieChart({ onTime, delayed }: { onTime: number; delayed: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 260
    const height = 220
    const radius = Math.min(width, height) / 2 - 20
    const innerRadius = radius * 0.65

    const g = svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const total = onTime + delayed
    const chartData = [
      { label: 'On Time', value: onTime, color: '#10b981' },
      { label: 'Delayed', value: delayed, color: '#f87171' }
    ].filter(d => d.value > 0)

    if (chartData.length === 0) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#94a3b8')
        .attr('font-size', '14px')
        .text('No Data')
      return
    }

    const defs = svg.append('defs')

    const dropShadow = defs.append('filter').attr('id', 'deliveryShadow')
    dropShadow.append('feDropShadow').attr('dx', 0).attr('dy', 4).attr('stdDeviation', 6).attr('flood-opacity', 0.12)

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.035)

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(8)

    const arcHover = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 10)
      .cornerRadius(8)

    g.selectAll('path')
      .data(pie(chartData))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('filter', 'url(#deliveryShadow)')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover)
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
      })
      .transition()
      .duration(1200)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return (t) => arc(interpolate(t)) || ''
      })

    // Center
    const centerGroup = g.append('g').attr('class', 'center-content')

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', '32px')
      .attr('font-weight', '800')
      .attr('fill', '#1e293b')
      .text(total > 0 ? `${Math.round((onTime / total) * 100)}%` : '0%')
      .attr('opacity', 0)
      .transition()
      .delay(800)
      .duration(400)
      .attr('opacity', 1)

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .attr('font-size', '11px')
      .attr('fill', '#64748b')
      .attr('font-weight', '600')
      .text('ON TIME')
      .attr('opacity', 0)
      .transition()
      .delay(900)
      .duration(400)
      .attr('opacity', 1)

  }, [onTime, delayed])

  return <svg ref={svgRef}></svg>
}

export function TrafficBarChart({ data }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 240
    const margin = { top: 20, right: 25, bottom: 40, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(data.map(d => d.hour))
      .range([0, innerWidth])
      .padding(0.35)

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.count) || 0) * 1.15])
      .range([innerHeight, 0])

    const defs = svg.append('defs')

    // Gradient bar
    const barGradient = defs.append('linearGradient')
      .attr('id', 'trafficBarAnimated')
      .attr('x1', 0).attr('y1', 1).attr('x2', 0).attr('y2', 0)
    barGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6')
    barGradient.append('stop').attr('offset', '50%').attr('stop-color', '#6366f1')
    barGradient.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6')

    // Glow
    const barGlow = defs.append('filter').attr('id', 'barGlow')
    barGlow.append('feGaussianBlur').attr('stdDeviation', 2).attr('result', 'coloredBlur')
    const barMerge = barGlow.append('feMerge')
    barMerge.append('feMergeNode').attr('in', 'coloredBlur')
    barMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '4,4')
    g.selectAll('.grid .domain').remove()

    // X Axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
    xAxis.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
    xAxis.select('.domain').attr('stroke', '#e2e8f0')
    xAxis.selectAll('.tick line').attr('stroke', '#e2e8f0')

    // Y Axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(5))
    yAxis.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
    yAxis.select('.domain').attr('stroke', '#e2e8f0')
    yAxis.selectAll('.tick line').remove()

    // Bars with animation
    g.selectAll('.traffic-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'traffic-bar')
      .attr('x', d => x(d.hour) || 0)
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', 'url(#trafficBarAnimated)')
      .attr('rx', 6)
      .attr('ry', 6)
      .style('filter', 'url(#barGlow)')
      .transition()
      .duration(800)
      .delay((d, i) => i * 80)
      .ease(d3.easeBackOut)
      .attr('y', d => y(d.count))
      .attr('height', d => innerHeight - y(d.count))

    // Value labels
    g.selectAll('.traffic-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'traffic-label')
      .attr('x', d => (x(d.hour) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('opacity', 0)
      .text(d => d.count)
      .transition()
      .delay((d, i) => 800 + i * 80)
      .duration(300)
      .attr('opacity', 1)

  }, [data])

  return <svg ref={svgRef}></svg>
}

export function RevenueChart({ data }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 200
    const margin = { top: 20, right: 25, bottom: 35, left: 55 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.45)

    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, d => d.value) || 0) * 1.15])
      .range([innerHeight, 0])

    const defs = svg.append('defs')

    // Green gradient
    const revenueGradient = defs.append('linearGradient')
      .attr('id', 'revenueAnimated')
      .attr('x1', 0).attr('y1', 1).attr('x2', 0).attr('y2', 0)
    revenueGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981')
    revenueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#34d399')

    // Shadow
    const revShadow = defs.append('filter').attr('id', 'revShadow')
    revShadow.append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 4).attr('flood-opacity', 0.1)

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
    g.selectAll('.grid .domain').remove()

    // X Axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
    xAxis.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
    xAxis.select('.domain').attr('stroke', '#e2e8f0')

    // Y Axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d3.format('.0s')(d as number)}`))
    yAxis.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
    yAxis.select('.domain').attr('stroke', '#e2e8f0')

    // Bars
    g.selectAll('.revenue-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'revenue-bar')
      .attr('x', d => x(d.label) || 0)
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', 'url(#revenueAnimated)')
      .attr('rx', 5)
      .attr('ry', 5)
      .style('filter', 'url(#revShadow)')
      .transition()
      .duration(700)
      .delay((d, i) => i * 100)
      .ease(d3.easeBackOut)
      .attr('y', d => y(d.value))
      .attr('height', d => innerHeight - y(d.value))

  }, [data])

  return <svg ref={svgRef}></svg>
}
