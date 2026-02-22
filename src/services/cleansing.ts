import * as XLSX from 'xlsx'
import { ValidationError, CleansedData } from '@/types'

const PRODUCTS = [
  "Men's Apparel", "Women's Apparel", 
  "Men's Street Footwear", "Women's Street Footwear",
  "Men's Athletic Footwear", "Women's Athletic Footwear"
]
const SALES_METHODS = ['Online (E-commerce)', 'In-store', 'Outlet']
const REGIONS = ['Sumatera Utara', 'DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'Sulawesi', 'Kalimantan']

export function parseExcelFile(buffer: Buffer): Partial<any>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)
  return data as Partial<any>[]
}

export function cleanseDataAdidas(
  rawData: Partial<any>[], 
  uploadedBy: string
): CleansedData {
  const errors: ValidationError[] = []
  const validData: Partial<any>[] = []
  let totalQualityScore = 0

  rawData.forEach((row, index) => {
    const rowNumber = index + 2
    const rowErrors: ValidationError[] = []
    let rowScore = 100

    const cleansedRow: any = {}

    // Retailer ID - use as retailer_name
    let retailerId = ''
    if (!row['Retailer ID'] && !row['Retailer ID ']) {
      rowErrors.push({
        row: rowNumber,
        column: 'Retailer ID',
        message: 'Retailer ID diperlukan',
        severity: 'warning'
      })
      rowScore -= 10
      retailerId = `RTL${Date.now()}${index}`
    } else {
      retailerId = String(row['Retailer ID'] || row['Retailer ID '] || '').trim()
    }
    cleansedRow.retailer_id = retailerId
    cleansedRow.retailer_name = retailerId  // Use retailer ID as name for lookup

    // Invoice Date
    let invoiceDate = parseDate(row['Invoice Date'])
    if (!invoiceDate) {
      rowErrors.push({
        row: rowNumber,
        column: 'Invoice Date',
        message: 'Format Invoice Date tidak valid',
        severity: 'warning'
      })
      rowScore -= 5
      invoiceDate = new Date()
    }
    cleansedRow.invoice_date = invoiceDate?.toISOString()

    // Region - this is actually the State in the Excel
    let region = String(row['Region'] || row['Region '] || '').trim()
    if (!region) {
      rowErrors.push({
        row: rowNumber,
        column: 'Region',
        message: 'Region diperlukan',
        severity: 'warning'
      })
      rowScore -= 5
    }
    cleansedRow.region = region || null
    cleansedRow.state = region || null  // Map Region to State

    // City
    let city = String(row['City'] || row['City '] || '').trim()
    cleansedRow.city = city || null

    // Product
    let product = String(row['Product'] || row['Product '] || '').trim()
    if (!product) {
      rowErrors.push({
        row: rowNumber,
        column: 'Product',
        message: 'Product diperlukan',
        severity: 'error'
      })
      rowScore -= 10
    }
    cleansedRow.product = product || 'Unknown'

    // Price per Unit
    let pricePerUnit = parseFloatValue(row['Price per Unit'])
    if (pricePerUnit === null || pricePerUnit < 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Price per Unit',
        message: 'Price per Unit harus >= 0',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.price_per_unit = pricePerUnit

    // Units Sold
    let unitsSold = parseNumber(row['Units Sold'])
    if (unitsSold === null || unitsSold < 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Units Sold',
        message: 'Units Sold harus >= 0',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.units_sold = unitsSold

    // Total Sales
    let totalSales = parseFloatValue(row['Total Sales'])
    if (totalSales === null || totalSales <= 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Total Sales',
        message: 'Total Sales harus > 0',
        severity: 'error'
      })
      rowScore -= 10
      totalSales = 0
    }
    cleansedRow.total_sales = totalSales || 0

    // Operating Profit
    let operatingProfit = parseFloatValue(row['Operating Profit'])
    if (operatingProfit === null) {
      rowErrors.push({
        row: rowNumber,
        column: 'Operating Profit',
        message: 'Operating Profit diperlukan',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.operating_profit = operatingProfit || 0

    // Operating Margin
    let operatingMargin = parseFloatValue(row['Operating Margin'])
    if (operatingMargin !== null && (operatingMargin < 0 || operatingMargin > 1)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Operating Margin',
        message: 'Operating Margin harus antara 0-1',
        severity: 'warning'
      })
      rowScore -= 2
      operatingMargin = null
    }
    cleansedRow.operating_margin = operatingMargin

    // Sales Method
    let salesMethod = String(row['Sales Method'] || row['Sales Method '] || '').trim()
    const salesMethodLower = salesMethod.toLowerCase()
    if (salesMethodLower.includes('online') || salesMethodLower.includes('e-commerce')) {
      salesMethod = 'Online (E-commerce)'
    } else if (salesMethodLower.includes('in-store') || salesMethodLower.includes('instore')) {
      salesMethod = 'In-store'
    } else if (salesMethodLower.includes('outlet')) {
      salesMethod = 'Outlet'
    }
    
    if (!SALES_METHODS.includes(salesMethod)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Sales Method',
        message: `Sales Method harus salah satu dari: ${SALES_METHODS.join(', ')}`,
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.sales_method = salesMethod || null

    // Metadata
    cleansedRow.uploaded_by = uploadedBy
    cleansedRow.quality_score = Math.max(0, rowScore)

    validData.push(cleansedRow)
    totalQualityScore += Math.max(0, rowScore)
    errors.push(...rowErrors)
  })

  const overallQuality = validData.length > 0 
    ? totalQualityScore / validData.length 
    : 0

  return {
    data: validData,
    errors,
    qualityScore: overallQuality
  }
}

export function parseDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  
  // Handle Excel serial numbers
  if (typeof value === 'number') {
    // Excel dates are stored as serial numbers (days since 1900-01-01 or 1904-01-01)
    const excelEpoch = new Date(1899, 11, 30) // Excel's epoch
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
    return isNaN(date.getTime()) ? null : date
  }
  
  // Try parsing as string
  if (typeof value === 'string') {
    // Try common date formats
    const formats = [
      // MM/DD/YYYY HH:MM
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})/,
      // DD/MM/YYYY HH:MM
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})/,
      // YYYY-MM-DD HH:MM:SS
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
    ]
    
    for (const format of formats) {
      const match = value.match(format)
      if (match) {
        // Try MM/DD/YYYY first
        let date = new Date(value)
        if (!isNaN(date.getTime())) return date
      }
    }
  }
  
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  
  // Handle string numbers with commas
  if (typeof value === 'string') {
    // Remove commas and whitespace
    const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
    const num = Number(cleaned)
    return isNaN(num) ? null : num
  }
  
  const num = Number(value)
  return isNaN(num) ? null : num
}

function parseFloatValue(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  
  // Handle string numbers with commas
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }
  
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === 'yes' || lower === '1') return true
    if (lower === 'false' || lower === 'no' || lower === '0') return false
  }
  return false
}

export function validateExcelHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = []
  const requiredHeaders = [
    'Retailer ID',
    'Invoice Date',
    'Product',
    'Total Sales',
    'Operating Profit'
  ]
  
  const optionalHeaders = [
    'Region',
    'State',
    'City',
    'Price per Unit',
    'Units Sold',
    'Operating Margin',
    'Sales Method'
  ]

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      column: 'Header',
      message: `Missing required columns: ${missingHeaders.join(', ')}`,
      severity: 'error'
    })
  }

  const missingOptional = optionalHeaders.filter(h => !headers.includes(h))
  if (missingOptional.length > 0 && missingHeaders.length === 0) {
    errors.push({
      row: 1,
      column: 'Header',
      message: `Optional columns not found (will use defaults): ${missingOptional.join(', ')}`,
      severity: 'warning'
    })
  }

  return errors
}
