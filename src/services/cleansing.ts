import * as XLSX from 'xlsx'
import { ValidationError, CleansedData } from '@/types'

const PIZZA_SIZES = ['Small', 'Medium', 'Large', 'XL']
const PIZZA_TYPES = ['Veg', 'Non-Veg', 'Vegan', 'Cheese Burst', 'Supreme', 'Meat Lovers', 'Margherita', 'Pepperoni', 'Hawaiian', 'BBQ Chicken', 'Seafood', 'Mushroom']
const TRAFFIC_LEVELS = ['Low', 'Medium', 'High']
const PAYMENT_METHODS = ['Card', 'Cash', 'Wallet', 'UPI', 'Hut Points']
const PAYMENT_CATEGORIES = ['Online', 'Offline']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December']

export function parseExcelFile(buffer: Buffer): Partial<any>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)
  return data as Partial<any>[]
}

export function cleanseData(
  rawData: Partial<any>[], 
  restaurantId: string,
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

    // Order ID - ensure unique
    let orderId = ''
    if (!row['Order ID']) {
      rowErrors.push({
        row: rowNumber,
        column: 'Order ID',
        message: 'Order ID diperlukan, menggunakan default',
        severity: 'warning'
      })
      rowScore -= 10
      orderId = `ORD${Date.now()}${index}${Math.floor(Math.random() * 1000)}`
    } else {
      orderId = String(row['Order ID']).trim().toUpperCase()
      if (!/^ORD\d+$/.test(orderId)) {
        rowErrors.push({
          row: rowNumber,
          column: 'Order ID',
          message: 'Format Order ID tidak standar',
          severity: 'warning'
        })
        rowScore -= 5
      }
      // Make unique by appending timestamp and index if needed
      orderId = `${orderId}_${Date.now()}_${index}`
    }
    cleansedRow.orderId = orderId

    // Restaurant Name - will be mapped to restaurantId
    const restaurantName = row['Restaurant Name'] || 'Unknown'
    if (!row['Restaurant Name']) {
      rowErrors.push({
        row: rowNumber,
        column: 'Restaurant Name',
        message: 'Nama restoran tidak tersedia',
        severity: 'warning'
      })
      rowScore -= 5
    }
    cleansedRow.restaurantName = restaurantName

    // Location
    if (!row['Location']) {
      rowErrors.push({
        row: rowNumber,
        column: 'Location',
        message: 'Lokasi diperlukan',
        severity: 'warning'
      })
      rowScore -= 5
    }
    cleansedRow.location = String(row['Location'] || '').trim()

    // Order Time
    let orderTime = parseDate(row['Order Time'])
    if (!orderTime) {
      rowErrors.push({
        row: rowNumber,
        column: 'Order Time',
        message: 'Format Order Time tidak valid, menggunakan waktu sekarang',
        severity: 'warning'
      })
      rowScore -= 5
      orderTime = new Date()
    }
    cleansedRow.orderTime = orderTime

    // Delivery Time
    let deliveryTime = parseDate(row['Delivery Time'])
    if (!deliveryTime) {
      rowErrors.push({
        row: rowNumber,
        column: 'Delivery Time',
        message: 'Format Delivery Time tidak valid, menggunakan estimasi',
        severity: 'warning'
      })
      rowScore -= 5
      deliveryTime = new Date(orderTime.getTime() + 30 * 60 * 1000) // +30 menit
    } else if (orderTime && deliveryTime < orderTime) {
      rowErrors.push({
        row: rowNumber,
        column: 'Delivery Time',
        message: 'Delivery Time lebih kecil dari Order Time, diperbaiki',
        severity: 'warning'
      })
      rowScore -= 5
      deliveryTime = new Date(orderTime.getTime() + 30 * 60 * 1000)
    }
    cleansedRow.deliveryTime = deliveryTime

    // Delivery Duration
    const deliveryDuration = parseNumber(row['Delivery Duration (min)'])
    if (deliveryDuration === null || deliveryDuration <= 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Delivery Duration',
        message: 'Delivery Duration harus lebih dari 0',
        severity: 'error'
      })
      rowScore -= 10
    }
    cleansedRow.deliveryDuration = deliveryDuration || 0

    // Order Month - Normalize
    let orderMonth = String(row['Order Month'] || '').trim()
    const monthMap: { [key: string]: string } = {
      'jan': 'January', 'january': 'January',
      'feb': 'February', 'february': 'February',
      'mar': 'March', 'march': 'March',
      'apr': 'April', 'april': 'April',
      'may': 'May',
      'jun': 'June', 'june': 'June',
      'jul': 'July', 'july': 'July',
      'aug': 'August', 'august': 'August',
      'sep': 'September', 'sept': 'September', 'september': 'September',
      'oct': 'October', 'october': 'October',
      'nov': 'November', 'november': 'November',
      'dec': 'December', 'december': 'December'
    }
    const orderMonthLower = orderMonth.toLowerCase()
    if (monthMap[orderMonthLower]) {
      orderMonth = monthMap[orderMonthLower]
    }
    
    if (!MONTHS.includes(orderMonth)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Order Month',
        message: `Order Month harus salah satu dari: ${MONTHS.join(', ')}`,
        severity: 'warning'
      })
      rowScore -= 5
    }
    cleansedRow.orderMonth = orderMonth || 'Unknown'

    // Order Hour
    const orderHour = parseNumber(row['Order Hour'])
    if (orderHour === null || orderHour < 0 || orderHour > 23) {
      rowErrors.push({
        row: rowNumber,
        column: 'Order Hour',
        message: 'Order Hour harus antara 0-23',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.orderHour = orderHour ?? 0

    // Pizza Size - Normalize
    let pizzaSize = String(row['Pizza Size'] || '').trim()
    const pizzaSizeLower = pizzaSize.toLowerCase()
    if (pizzaSizeLower === 'small' || pizzaSizeLower === 's') pizzaSize = 'Small'
    else if (pizzaSizeLower === 'medium' || pizzaSizeLower === 'med' || pizzaSizeLower === 'm') pizzaSize = 'Medium'
    else if (pizzaSizeLower === 'large' || pizzaSizeLower === 'l') pizzaSize = 'Large'
    else if (pizzaSizeLower === 'xl' || pizzaSizeLower === 'extra large' || pizzaSizeLower === 'extra-large') pizzaSize = 'XL'
    
    if (!PIZZA_SIZES.includes(pizzaSize)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Pizza Size',
        message: `Pizza Size harus salah satu dari: ${PIZZA_SIZES.join(', ')}`,
        severity: 'warning'
      })
      rowScore -= 5
    }
    cleansedRow.pizzaSize = pizzaSize || 'Unknown'

    // Pizza Type - Normalize with more variations
    let pizzaType = String(row['Pizza Type'] || '').trim()
    const pizzaTypeLower = pizzaType.toLowerCase()
    
    // Normalize common variations
    if (pizzaTypeLower.includes('veg') && !pizzaTypeLower.includes('non')) pizzaType = 'Veg'
    else if (pizzaTypeLower.includes('non') && pizzaTypeLower.includes('veg')) pizzaType = 'Non-Veg'
    else if (pizzaTypeLower.includes('vegan') || pizzaTypeLower.includes('plant')) pizzaType = 'Vegan'
    else if (pizzaTypeLower.includes('cheese') && pizzaTypeLower.includes('burst')) pizzaType = 'Cheese Burst'
    else if (pizzaTypeLower.includes('supreme')) pizzaType = 'Supreme'
    else if (pizzaTypeLower.includes('meat') || pizzaTypeLower.includes('lover')) pizzaType = 'Meat Lovers'
    else if (pizzaTypeLower.includes('margherita') || pizzaTypeLower.includes('margarita')) pizzaType = 'Margherita'
    else if (pizzaTypeLower.includes('pepperoni')) pizzaType = 'Pepperoni'
    else if (pizzaTypeLower.includes('hawaiian')) pizzaType = 'Hawaiian'
    else if (pizzaTypeLower.includes('bbq') || pizzaTypeLower.includes('chicken')) pizzaType = 'BBQ Chicken'
    else if (pizzaTypeLower.includes('seafood')) pizzaType = 'Seafood'
    else if (pizzaTypeLower.includes('mushroom')) pizzaType = 'Mushroom'
    
    if (!PIZZA_TYPES.includes(pizzaType)) {
      // Don't add error, just set to Unknown
      pizzaType = 'Unknown'
    }
    cleansedRow.pizzaType = pizzaType || 'Unknown'

    // Toppings Count
    const toppingsCount = parseNumber(row['Toppings Count'])
    if (toppingsCount === null || toppingsCount < 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Toppings Count',
        message: 'Toppings Count harus >= 0',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.toppingsCount = toppingsCount ?? 0

    // Pizza Complexity
    const pizzaComplexity = parseNumber(row['Pizza Complexity'])
    if (pizzaComplexity === null || pizzaComplexity < 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Pizza Complexity',
        message: 'Pizza Complexity harus >= 0',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.pizzaComplexity = pizzaComplexity ?? 0

    // Topping Density
    const toppingDensity = parseFloatValue(row['Topping Density'])
    cleansedRow.toppingDensity = (toppingDensity === null || isNaN(toppingDensity)) ? null : toppingDensity

    // Distance
    let distanceKm = parseFloatValue(row['Distance (km)'])
    if (distanceKm === null || distanceKm <= 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Distance',
        message: 'Distance tidak valid, menggunakan default 5 km',
        severity: 'warning'
      })
      rowScore -= 5
      distanceKm = 5
    }
    cleansedRow.distanceKm = distanceKm

    // Traffic Level - Normalize
    let trafficLevel = String(row['Traffic Level'] || '').trim()
    const trafficLevelLower = trafficLevel.toLowerCase()
    if (trafficLevelLower === 'low' || trafficLevelLower === 'l') trafficLevel = 'Low'
    else if (trafficLevelLower === 'medium' || trafficLevelLower === 'med' || trafficLevelLower === 'm') trafficLevel = 'Medium'
    else if (trafficLevelLower === 'high' || trafficLevelLower === 'h') trafficLevel = 'High'
    
    if (!TRAFFIC_LEVELS.includes(trafficLevel)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Traffic Level',
        message: `Traffic Level harus salah satu dari: ${TRAFFIC_LEVELS.join(', ')}`,
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.trafficLevel = trafficLevel || 'Unknown'

    // Traffic Impact
    const trafficImpact = parseNumber(row['Traffic Impact'])
    if (trafficImpact === null || trafficImpact < 1 || trafficImpact > 3) {
      rowErrors.push({
        row: rowNumber,
        column: 'Traffic Impact',
        message: 'Traffic Impact harus antara 1-3',
        severity: 'warning'
      })
      rowScore -= 2
    }
    cleansedRow.trafficImpact = trafficImpact ?? 1

    // Is Peak Hour
    cleansedRow.isPeakHour = parseBoolean(row['Is Peak Hour'])

    // Is Weekend
    cleansedRow.isWeekend = parseBoolean(row['Is Weekend'])

    // Payment Method - Normalize values
    let paymentMethod = String(row['Payment Method'] || '').trim()
    
    // Normalize payment method values
    const paymentMethodLower = paymentMethod.toLowerCase()
    if (paymentMethodLower.includes('card') || paymentMethodLower.includes('credit') || paymentMethodLower.includes('debit')) {
      paymentMethod = 'Card'
    } else if (paymentMethodLower.includes('cash')) {
      paymentMethod = 'Cash'
    } else if (paymentMethodLower.includes('wallet') || paymentMethodLower.includes('e-wallet') || paymentMethodLower.includes('ewallet')) {
      paymentMethod = 'Wallet'
    } else if (paymentMethodLower.includes('upi') || paymentMethodLower.includes('transfer')) {
      paymentMethod = 'UPI'
    } else if (paymentMethodLower.includes('hut') || paymentMethodLower.includes('points')) {
      paymentMethod = 'Hut Points'
    }
    
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Payment Method',
        message: `Payment Method "${row['Payment Method']}" tidak dikenali. Harus salah satu dari: ${PAYMENT_METHODS.join(', ')}`,
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.paymentMethod = paymentMethod || 'Unknown'

    // Payment Category - Normalize
    let paymentCategory = String(row['Payment Category'] || '').trim()
    const paymentCategoryLower = paymentCategory.toLowerCase()
    if (paymentCategoryLower === 'online' || paymentCategoryLower === 'digital' || paymentCategoryLower === 'electronic') paymentCategory = 'Online'
    else if (paymentCategoryLower === 'offline' || paymentCategoryLower === 'cash' || paymentCategoryLower === 'in-store') paymentCategory = 'Offline'
    
    if (!PAYMENT_CATEGORIES.includes(paymentCategory)) {
      rowErrors.push({
        row: rowNumber,
        column: 'Payment Category',
        message: `Payment Category harus salah satu dari: ${PAYMENT_CATEGORIES.join(', ')}`,
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.paymentCategory = paymentCategory || 'Unknown'

    // Estimated Duration
    const estimatedDuration = parseFloatValue(row['Estimated Duration (min)'])
    if (estimatedDuration === null || estimatedDuration <= 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Estimated Duration',
        message: 'Estimated Duration harus > 0',
        severity: 'warning'
      })
      rowScore -= 3
    }
    cleansedRow.estimatedDuration = estimatedDuration || 0

    // Delivery Efficiency
    const deliveryEfficiency = parseFloatValue(row['Delivery Efficiency (min/km)'])
    cleansedRow.deliveryEfficiency = (deliveryEfficiency === null || isNaN(deliveryEfficiency)) ? null : deliveryEfficiency

    // Delay
    const delayMin = parseFloatValue(row['Delay (min)'])
    if (delayMin === null || delayMin < 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'Delay',
        message: 'Delay harus >= 0',
        severity: 'warning'
      })
      rowScore -= 2
    }
    cleansedRow.delayMin = delayMin ?? 0

    // Is Delayed
    cleansedRow.isDelayed = parseBoolean(row['Is Delayed'])

    // Restaurant Avg Time
    const restaurantAvgTime = parseFloatValue(row['Restaurant Avg Time'])
    cleansedRow.restaurantAvgTime = (restaurantAvgTime === null || isNaN(restaurantAvgTime)) ? null : restaurantAvgTime

    // Add metadata
    cleansedRow.restaurantId = restaurantId
    cleansedRow.uploadedBy = uploadedBy
    cleansedRow.uploadedAt = new Date()
    cleansedRow.qualityScore = Math.max(0, rowScore)

    // Accept all data, just track quality score
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

function parseDate(value: any): Date | null {
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
    'Order ID',
    'Restaurant Name',
    'Location',
    'Order Time',
    'Delivery Time',
    'Delivery Duration (min)',
    'Pizza Size',
    'Pizza Type',
    'Toppings Count',
    'Distance (km)',
    'Traffic Level',
    'Payment Method',
    'Is Peak Hour',
    'Is Weekend',
    'Order Month',
    'Payment Category'
  ]
  
  const optionalHeaders = [
    'Estimated Duration (min)',
    'Delay (min)',
    'Is Delayed',
    'Pizza Complexity',
    'Traffic Impact',
    'Order Hour'
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
