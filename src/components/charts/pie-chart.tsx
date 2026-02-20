'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface PieChartProps {
  data: { label: string; value: number }[]
  title: string
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4']

export function PieChart({ data, title }: PieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 })

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 300
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = dimensions.width
    const height = dimensions.height
    const radius = Math.min(width, height) / 2 - 40

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(COLORS)

    const pie = d3.pie<{ label: string; value: number }>()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius)

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8)
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1)
      })

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(d => d.data.value > 0 ? d.data.label : '')

  }, [data, dimensions])

  return (
    <div ref={containerRef} className="w-full">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-sm text-gray-600">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}
