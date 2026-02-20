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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const itemColumn = formData.get('item_column') as string || 'pizza_type'
    const categoryColumn = formData.get('category_column') as string || 'pizza_size'
    const orderIdColumn = formData.get('order_id_column') as string || 'order_id'
    const dateColumn = formData.get('date_column') as string || 'order_date'
    const n = parseInt(formData.get('n') as string || '10')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const csvData = parseCSV(text)

    if (csvData.length === 0) {
      return NextResponse.json({ error: 'No data in file' }, { status: 400 })
    }

    const itemKey = Object.keys(csvData[0]).find(k => k.toLowerCase().includes('pizza_type') || k.toLowerCase().includes(itemColumn.toLowerCase())) || itemColumn
    const categoryKey = Object.keys(csvData[0]).find(k => k.toLowerCase().includes('pizza_size') || k.toLowerCase().includes(categoryColumn.toLowerCase())) || categoryColumn
    const orderIdKey = Object.keys(csvData[0]).find(k => k.toLowerCase().includes('order_id')) || orderIdColumn
    const order_id = orderIdColumn
    const dateKey = Object.keys(csvData[0]).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month')) || dateColumn

    const itemCounts: { [key: string]: number } = {}
    const categoryItems: { [key: string]: { [key: string]: number } } = {}
    const orderItems: { [key: string]: Set<string> } = {}
    const dateItems: { [key: string]: { [key: string]: number } } = {}

    csvData.forEach(row => {
      const item = row[itemKey] || row[itemColumn] || ''
      const category = row[categoryKey] || row[categoryColumn] || ''
      const orderId = row[orderIdKey] || row[order_id] || ''
      const date = row[dateKey] || row[dateColumn] || ''

      if (item) {
        itemCounts[item] = (itemCounts[item] || 0) + 1
        
        if (category) {
          if (!categoryItems[category]) categoryItems[category] = {}
          categoryItems[category][item] = (categoryItems[category][item] || 0) + 1
        }
      }

      if (orderId) {
        if (!orderItems[orderId]) orderItems[orderId] = new Set()
        orderItems[orderId].add(item)
      }

      if (date && item) {
        if (!dateItems[date]) dateItems[date] = {}
        dateItems[date][item] = (dateItems[date][item] || 0) + 1
      }
    })

    const totalOrders = Object.keys(orderItems).length

    const popularItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([item, count]) => ({
        item,
        order_count: count,
        percentage: ((count / totalOrders) * 100).toFixed(1)
      }))

    const byCategory: { category: string; item: string; order_count: number }[] = []
    Object.entries(categoryItems).forEach(([category, items]) => {
      Object.entries(items).forEach(([item, count]) => {
        byCategory.push({ category, item, order_count: count })
      })
    })
    byCategory.sort((a, b) => b.order_count - a.order_count)

    const pairCounts: { [key: string]: number } = {}
    Object.values(orderItems).forEach(items => {
      const itemArray = Array.from(items).sort()
      for (let i = 0; i < itemArray.length; i++) {
        for (let j = i + 1; j < itemArray.length; j++) {
          const pair = `${itemArray[i]}|${itemArray[j]}`
          pairCounts[pair] = (pairCounts[pair] || 0) + 1
        }
      }
    })

    const frequentlyBoughtTogether = Object.entries(pairCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([pair, count]) => {
        const [item1, item2] = pair.split('|')
        return { item1, item2, count }
      })

    const sortedDates = Object.keys(dateItems).sort()
    const recentDates = sortedDates.slice(-Math.min(7, sortedDates.length))
    const olderDates = sortedDates.slice(-Math.min(14, sortedDates.length - 7))

    const recentCounts: { [key: string]: number } = {}
    const olderCounts: { [key: string]: number } = {}

    recentDates.forEach(date => {
      Object.entries(dateItems[date]).forEach(([item, count]) => {
        recentCounts[item] = (recentCounts[item] || 0) + count
      })
    })

    olderDates.forEach(date => {
      Object.entries(dateItems[date]).forEach(([item, count]) => {
        olderCounts[item] = (olderCounts[item] || 0) + count
      })
    })

    const trending = Object.keys(recentCounts).map(item => {
      const recent = recentCounts[item] || 0
      const older = olderCounts[item] || 1
      const trend = older === 0 ? recent : (recent - older) / older
      return {
        item,
        recent_count: recent,
        trend
      }
    }).sort((a, b) => b.trend - a.trend).slice(0, n)

    return NextResponse.json({
      success: true,
      recommendations: {
        popular_items: popularItems,
        by_category: byCategory.slice(0, n * 5),
        frequently_bought_together: frequentlyBoughtTogether,
        trending
      }
    })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
