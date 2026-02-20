import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const data: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })
    data.push(row)
  }
  
  return data
}

function linearTrend(data: number[], periods: number = 7): number[] {
  const n = data.length
  if (n < 2) return Array(periods).fill(data[0] || 0)
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i]
    sumXY += i * data[i]
    sumX2 += i * i
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  const forecasts: number[] = []
  for (let i = 0; i < periods; i++) {
    forecasts.push(slope * (n + i) + intercept)
  }
  
  return forecasts
}

function getMostFrequent(data: string[]): string {
  const counts: { [key: string]: number } = {}
  data.forEach(d => {
    counts[d] = (counts[d] || 0) + 1
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const dateColumn = formData.get('date_column') as string || 'order_date'
    const valueColumn = formData.get('value_column') as string || 'order_count'
    const periods = parseInt(formData.get('periods') as string || '7')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const csvData = parseCSV(text)

    if (csvData.length === 0) {
      return NextResponse.json({ error: 'No data in file' }, { status: 400 })
    }

    const dateKey = Object.keys(csvData[0]).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month')) || dateColumn

    let groupedData: { [key: string]: number } = {}
    let categoryData: { [key: string]: { [key: string]: number } } = {}
    let isCategorical = ['pizza_type', 'pizza_size', 'payment_method', 'traffic_level'].includes(valueColumn)
    
    if (isCategorical) {
      csvData.forEach(row => {
        const dateVal = row[dateKey] || row[dateColumn] || ''
        const catVal = row[valueColumn] || ''
        if (dateVal && catVal) {
          if (!categoryData[dateVal]) categoryData[dateVal] = {}
          categoryData[dateVal][catVal] = (categoryData[dateVal][catVal] || 0) + 1
        }
      })
      
      Object.keys(categoryData).forEach(date => {
        const mostFreq = getMostFrequent(Object.keys(categoryData[date]))
        groupedData[date] = categoryData[date][mostFreq] || 0
      })
    } else {
      csvData.forEach(row => {
        const dateVal = row[dateKey] || row[dateColumn] || ''
        const valueVal = parseFloat(row[valueColumn] || '0') || 0
        if (dateVal) {
          if (valueColumn === 'order_count') {
            groupedData[dateVal] = (groupedData[dateVal] || 0) + 1
          } else {
            groupedData[dateVal] = (groupedData[dateVal] || 0) + valueVal
          }
        }
      })
    }

    const sortedDates = Object.keys(groupedData).sort()
    const timeSeriesData = sortedDates.map(date => groupedData[date])

    if (timeSeriesData.length < 3) {
      return NextResponse.json({ 
        success: false,
        error: 'Minimal 3 data point diperlukan untuk forecasting' 
      })
    }

    const forecast = linearTrend(timeSeriesData, periods)

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    const n = timeSeriesData.length
    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += timeSeriesData[i]
      sumXY += i * timeSeriesData[i]
      sumX2 += i * i
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const historical = sortedDates.map((date, i) => ({
      date,
      actual: timeSeriesData[i],
      forecast: slope * i + intercept
    }))

    return NextResponse.json({
      success: true,
      method: 'Linear Trend',
      historical,
      forecast,
      periods,
      isCategorical
    })
  } catch (error) {
    console.error('Forecasting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
