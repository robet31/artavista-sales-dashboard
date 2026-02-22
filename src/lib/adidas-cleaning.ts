import * as XLSX from 'xlsx'

export interface CleanedRow {
  retailer: string
  invoice_date: string
  state: string
  city: string
  product: string
  price_per_unit: number
  units_sold: number
  total_sales: number
  operating_profit: number
  operating_margin: number
  sales_method: string
}

export interface CleaningResult {
  data: CleanedRow[]
  errors: string[]
  totalProcessed: number
  totalRows: number
}

const PRODUCT_CYCLE = [
  "Men's Apparel",
  "Women's Apparel",
  "Men's Street Footwear",
  "Men's Athletic Footwear",
  "Women's Street Footwear",
  "Women's Athletic Footwear"
]

const SALES_METHODS = ['Online (E-commerce)', 'In-store', 'Outlet']

export function cleanAdidasData(file: File): Promise<CleaningResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' })

        const result = processAdidasData(jsonData)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function processAdidasData(rawData: any[]): CleaningResult {
  const errors: string[] = []
  const cleanedData: CleanedRow[] = []

  // Find the header row (contains "Retailer ID", "Invoice Date", etc.)
  let headerRowIndex = -1
  let dataStartIndex = 0

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i]
    if (row['Retailer ID'] || row['Retailer ID ']) {
      headerRowIndex = i
      dataStartIndex = i + 2 // Skip header and sub-header rows
      break
    }
  }

  if (headerRowIndex === -1) {
    return {
      data: [],
      errors: ['Cannot find header row with Retailer ID'],
      totalProcessed: 0,
      totalRows: rawData.length
    }
  }

  // Get data rows (skip header and empty rows)
  const dataRows = rawData.slice(dataStartIndex).filter(row =>
    row['Retailer ID'] || row['Retailer ID '] || row['Invoice Date']
  )

  // Extract retailer name from row 3 (0-indexed would be row 2)
  let retailerName = 'Unknown'
  if (rawData[3] && rawData[3]['Unnamed: 10']) {
    retailerName = String(rawData[3]['Unnamed: 10']).trim()
  }

  let lastState = ''
  let lastCity = ''
  let lastMethod = ''

  dataRows.forEach((row, index) => {
    try {
      // Get State (Region column)
      let state = String(row['Region'] || row['Region '] || '').trim()
      if (state) {
        lastState = state
      } else {
        state = lastState
      }

      // Get City
      let city = String(row['Unnamed: 4'] || row['City'] || '').trim()
      if (city) {
        lastCity = city
      } else {
        city = lastCity
      }

      // Get Sales Method
      let method = String(row['Sales Method'] || row['Sales Method '] || '').trim()
      if (method) {
        lastMethod = method
      } else {
        method = lastMethod
      }

      // Normalize sales method
      const methodLower = method.toLowerCase()
      if (methodLower.includes('online') || methodLower.includes('e-commerce')) {
        method = 'Online (E-commerce)'
      } else if (methodLower.includes('in-store') || methodLower.includes('instore') || methodLower === 'store') {
        method = 'In-store'
      } else if (methodLower.includes('outlet')) {
        method = 'Outlet'
      } else {
        method = 'Online (E-commerce)' // Default
      }

      // Get Invoice Date
      let invoiceDate = row['Invoice Date']
      if (invoiceDate) {
        if (typeof invoiceDate === 'string') {
          const parsed = new Date(invoiceDate)
          if (!isNaN(parsed.getTime())) {
            invoiceDate = parsed.toISOString().split('T')[0]
          }
        } else if (invoiceDate instanceof Date) {
          invoiceDate = invoiceDate.toISOString().split('T')[0]
        }
      }
      if (!invoiceDate) {
        invoiceDate = new Date().toISOString().split('T')[0]
      }

      // Get Product
      let product = String(row['Product'] || '').trim()
      if (!product) {
        // Use cycling pattern based on row index
        const productIndex = index % 6
        product = PRODUCT_CYCLE[productIndex]
      }

      // Get numeric values
      let pricePerUnit = parseFloat(String(row['Price per Unit'] || '0').replace(/,/g, '')) || 0
      let unitsSold = parseInt(String(row['Units Sold'] || '0').replace(/,/g, '')) || 1
      let totalSales = parseFloat(String(row['Total Sales'] || '0').replace(/,/g, '')) || 0
      let operatingProfit = parseFloat(String(row['Operating Profit'] || '0').replace(/,/g, '')) || 0
      let operatingMargin = parseFloat(row['Operating Margin'] || '0') || 0

      // Calculate missing values
      if (totalSales > 0 && pricePerUnit > 0 && unitsSold === 1) {
        unitsSold = Math.round(totalSales / pricePerUnit)
      }

      if (totalSales > 0 && unitsSold > 0 && pricePerUnit === 0) {
        pricePerUnit = totalSales / unitsSold
      }

      if (totalSales === 0 && pricePerUnit > 0 && unitsSold > 0) {
        totalSales = pricePerUnit * unitsSold
      }

      if (operatingProfit === 0 && totalSales > 0 && operatingMargin > 0) {
        operatingProfit = totalSales * operatingMargin
      }

      if (operatingMargin === 0 && totalSales > 0 && operatingProfit > 0) {
        operatingMargin = operatingProfit / totalSales
      }

      // Get Retailer ID and use as retailer name
      let retailerId = row['Retailer ID'] || row['Retailer ID '] || ''
      if (!retailerName || retailerName === 'Unknown') {
        retailerName = String(retailerId).trim() || 'Ramayana'
      }

      // Only add if we have valid data
      if (totalSales > 0) {
        cleanedData.push({
          retailer: retailerName,
          invoice_date: invoiceDate,
          state: state || 'Unknown',
          city: city || 'Unknown',
          product: product,
          price_per_unit: pricePerUnit,
          units_sold: unitsSold,
          total_sales: totalSales,
          operating_profit: operatingProfit,
          operating_margin: operatingMargin,
          sales_method: method
        })
      }

    } catch (err: any) {
      errors.push(`Row ${index + dataStartIndex}: ${err.message}`)
    }
  })

  return {
    data: cleanedData,
      errors: errors,
      totalProcessed: cleanedData.length,
      totalRows: rawData.length
    }
  }

export function insertToSupabase(data: CleanedRow[]): Promise<{ success: boolean; message: string }> {
  return fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleanedData: data })
  }).then(res => res.json())
}
