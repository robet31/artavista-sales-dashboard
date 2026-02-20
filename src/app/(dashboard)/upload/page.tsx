'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CheckCircle2, Upload, FileSpreadsheet, Loader2, X, Wand2, Eye, RefreshCw, ArrowRight, Settings, AlertTriangle, Database, Table, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

interface Restaurant {
  id: string
  name: string
  code: string
}

interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning' | 'info'
  originalValue?: any
  cleanedValue?: any
}

interface ColumnMapping {
  [key: string]: string
}

const REQUIRED_HEADERS = [
  'Order ID', 'Restaurant Name', 'Location', 'Order Time', 'Delivery Time',
  'Delivery Duration (min)', 'Pizza Size', 'Pizza Type', 'Distance (km)',
  'Traffic Level', 'Payment Method', 'Is Peak Hour', 'Is Weekend'
]

const OPTIONAL_HEADERS = [
  'Order Month', 'Payment Category', 'Toppings Count', 'Pizza Complexity',
  'Topping Density', 'Traffic Impact', 'Estimated Duration (min)',
  'Delivery Efficiency (min/km)', 'Delay (min)', 'Is Delayed', 'Restaurant Avg Time', 'Order Hour'
]

const PIZZA_SIZES = ['Small', 'Medium', 'Large', 'XL']
const PIZZA_TYPES = ['Veg', 'Non-Veg', 'Vegan', 'Cheese Burst', 'Supreme', 'Meat Lovers', 'Margherita', 'Pepperoni', 'Hawaiian', 'BBQ Chicken', 'Seafood', 'Mushroom']
const TRAFFIC_LEVELS = ['Low', 'Medium', 'High']
const PAYMENT_METHODS = ['Card', 'Cash', 'Wallet', 'UPI', 'Hut Points']
const PAYMENT_CATEGORIES = ['Online', 'Offline']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function UploadPage() {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [cleanedData, setCleanedData] = useState<any[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [qualityScore, setQualityScore] = useState(0)

  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [showMapping, setShowMapping] = useState(false)
  const [autoClean, setAutoClean] = useState(true)

  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: {
      totalRows: number
      validRows: number
      invalidRows: number
      qualityScore: number
      errors: ValidationError[]
    }
  } | null>(null)

  const [dbStatus, setDbStatus] = useState<{
    totalCount: number
    recentData: any[]
    restaurants: any[]
    userRole?: string
    userRestaurantId?: string | null
    isSuperAdmin?: boolean
    whereClause?: any
    allData?: any[]
  } | null>(null)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const [dbAccordionOpen, setDbAccordionOpen] = useState(false)

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userRestaurantId = (session?.user as any)?.restaurantId
  const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isManagerOrStaff = userRole === 'MANAGER' || userRole === 'STAFF'
  const hasAssignedRestaurant = !!userRestaurantId

  const missingHeaders = useMemo(() => {
    return REQUIRED_HEADERS.filter(h => !headers.includes(h) && !Object.values(columnMapping).includes(h))
  }, [headers, columnMapping])

  const unmappedColumns = useMemo(() => {
    return headers.filter(h => !REQUIRED_HEADERS.includes(h) && !OPTIONAL_HEADERS.includes(h))
  }, [headers])

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch('/api/upload')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data)
        if (userRestaurantId) {
          const assigned = data.find((r: Restaurant) => r.id === userRestaurantId)
          if (assigned) setSelectedRestaurant(userRestaurantId)
        } else if (data.length === 1) {
          setSelectedRestaurant(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }, [userRestaurantId])

  useEffect(() => {
    fetchRestaurants()
    checkDatabase()
  }, [fetchRestaurants])

  const checkDatabase = async () => {
    setIsCheckingDb(true)
    try {
      const res = await fetch('/api/debug?debug=true&raw=true')
      if (res.ok) {
        const data = await res.json()
        setDbStatus(data)
        console.log('Database status:', data)
      } else {
        const err = await res.json()
        console.error('Debug API error:', err)
      }
    } catch (error) {
      console.error('Error checking database:', error)
    } finally {
      setIsCheckingDb(false)
    }
  }

  const parseExcelFile = useCallback((file: File) => {
    return new Promise<{ data: any[], headers: string[] }>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' })
          const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
          resolve({ data: jsonData, headers })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      setIsParsing(true)
      setResult(null)
      setCleanedData([])
      setErrors([])

      try {
        const { data, headers: fileHeaders } = await parseExcelFile(selectedFile)
        setRawData(data)
        setHeaders(fileHeaders)

        const autoMapping: ColumnMapping = {}
        fileHeaders.forEach(header => {
          const normalized = header.toLowerCase().trim()
          if (normalized.includes('order') && normalized.includes('id')) autoMapping['Order ID'] = header
          else if (normalized.includes('restaurant')) autoMapping['Restaurant Name'] = header
          else if (normalized.includes('location') || normalized.includes('alamat')) autoMapping['Location'] = header
          else if (normalized.includes('order') && normalized.includes('time')) autoMapping['Order Time'] = header
          else if (normalized.includes('delivery') && normalized.includes('time')) autoMapping['Delivery Time'] = header
          else if (normalized.includes('delivery') && normalized.includes('duration')) autoMapping['Delivery Duration (min)'] = header
          else if (normalized.includes('pizza') && normalized.includes('size')) autoMapping['Pizza Size'] = header
          else if (normalized.includes('pizza') && normalized.includes('type')) autoMapping['Pizza Type'] = header
          else if (normalized.includes('distance') || normalized.includes('jarak')) autoMapping['Distance (km)'] = header
          else if (normalized.includes('traffic') && normalized.includes('level')) autoMapping['Traffic Level'] = header
          else if (normalized.includes('payment') && normalized.includes('method')) autoMapping['Payment Method'] = header
          else if (normalized.includes('peak') && normalized.includes('hour')) autoMapping['Is Peak Hour'] = header
          else if (normalized.includes('weekend')) autoMapping['Is Weekend'] = header
          else if (normalized.includes('order') && normalized.includes('month')) autoMapping['Order Month'] = header
          else if (normalized.includes('payment') && normalized.includes('category')) autoMapping['Payment Category'] = header
          else if (normalized.includes('topping') && normalized.includes('count')) autoMapping['Toppings Count'] = header
          else if (normalized.includes('pizza') && normalized.includes('complexity')) autoMapping['Pizza Complexity'] = header
          else if (normalized.includes('topping') && normalized.includes('density')) autoMapping['Topping Density'] = header
          else if (normalized.includes('traffic') && normalized.includes('impact')) autoMapping['Traffic Impact'] = header
          else if (normalized.includes('estimated') && normalized.includes('duration')) autoMapping['Estimated Duration (min)'] = header
          else if (normalized.includes('efficiency')) autoMapping['Delivery Efficiency (min/km)'] = header
          else if (normalized.includes('delay')) autoMapping['Delay (min)'] = header
          else if (normalized.includes('delayed')) autoMapping['Is Delayed'] = header
          else if (normalized.includes('restaurant') && normalized.includes('avg')) autoMapping['Restaurant Avg Time'] = header
          else if (normalized.includes('order') && normalized.includes('hour')) autoMapping['Order Hour'] = header
        })
        setColumnMapping(autoMapping)

        if (autoClean) {
          cleanData(data, autoMapping)
        }
      } catch (error) {
        console.error('Parse error:', error)
        setResult({
          success: false,
          message: 'Gagal memproses file Excel'
        })
      } finally {
        setIsParsing(false)
      }
    }
  }, [parseExcelFile, autoClean])

  const getMappedValue = useCallback((row: any, targetField: string): any => {
    const sourceColumn = columnMapping[targetField]
    if (!sourceColumn) return row[targetField]
    return row[sourceColumn]
  }, [columnMapping])

  const cleanData = useCallback((data: any[], mapping?: ColumnMapping) => {
    setIsCleaning(true)
    const useMapping = mapping || columnMapping
    const allErrors: ValidationError[] = []
    const cleaned: any[] = []
    let totalScore = 0

    data.forEach((row, index) => {
      const rowNumber = index + 2
      const rowErrors: ValidationError[] = []
      let rowScore = 100

      const cleansedRow: any = {}

      let orderId = getMappedValue(row, 'Order ID')
      if (!orderId) {
        rowErrors.push({ row: rowNumber, column: 'Order ID', message: 'Order ID diperlukan', severity: 'warning', originalValue: orderId, cleanedValue: `ORD${Date.now()}${index}` })
        rowScore -= 10
        orderId = `ORD${Date.now()}${index}`
      } else {
        orderId = String(orderId).trim().toUpperCase()
        if (!/^ORD\d+$/.test(orderId)) {
          rowErrors.push({ row: rowNumber, column: 'Order ID', message: 'Format Order ID tidak standar', severity: 'warning', originalValue: orderId, cleanedValue: orderId })
          rowScore -= 5
        }
        orderId = `${orderId}_${Date.now()}_${index}`
      }
      cleansedRow.orderId = orderId

      const restaurantName = getMappedValue(row, 'Restaurant Name') || 'Unknown'
      if (!getMappedValue(row, 'Restaurant Name')) {
        rowErrors.push({ row: rowNumber, column: 'Restaurant Name', message: 'Nama restoran tidak tersedia', severity: 'warning', originalValue: null, cleanedValue: 'Unknown' })
        rowScore -= 5
      }
      cleansedRow.restaurantName = restaurantName

      let location = getMappedValue(row, 'Location')
      if (!location) {
        rowErrors.push({ row: rowNumber, column: 'Location', message: 'Lokasi diperlukan', severity: 'warning', originalValue: location, cleanedValue: '' })
        rowScore -= 5
      }
      cleansedRow.location = String(location || '').trim()

      let orderTime = parseDateExcel(getMappedValue(row, 'Order Time'))
      if (!orderTime) {
        rowErrors.push({ row: rowNumber, column: 'Order Time', message: 'Format Order Time tidak valid', severity: 'warning', originalValue: getMappedValue(row, 'Order Time'), cleanedValue: new Date().toISOString() })
        rowScore -= 5
        orderTime = new Date()
      }
      cleansedRow.orderTime = orderTime

      let deliveryTime = parseDateExcel(getMappedValue(row, 'Delivery Time'))
      if (!deliveryTime) {
        rowErrors.push({ row: rowNumber, column: 'Delivery Time', message: 'Format Delivery Time tidak valid', severity: 'warning', originalValue: getMappedValue(row, 'Delivery Time'), cleanedValue: new Date(orderTime.getTime() + 30 * 60000).toISOString() })
        rowScore -= 5
        deliveryTime = new Date(orderTime.getTime() + 30 * 60000)
      } else if (orderTime && deliveryTime < orderTime) {
        rowErrors.push({ row: rowNumber, column: 'Delivery Time', message: 'Delivery Time lebih kecil dari Order Time', severity: 'warning', originalValue: deliveryTime.toISOString(), cleanedValue: new Date(orderTime.getTime() + 30 * 60000).toISOString() })
        rowScore -= 5
        deliveryTime = new Date(orderTime.getTime() + 30 * 60000)
      }
      cleansedRow.deliveryTime = deliveryTime

      let deliveryDuration = parseNumber(getMappedValue(row, 'Delivery Duration (min)'))
      if (deliveryDuration === null || deliveryDuration <= 0) {
        rowErrors.push({ row: rowNumber, column: 'Delivery Duration', message: 'Delivery Duration harus > 0', severity: 'error', originalValue: getMappedValue(row, 'Delivery Duration (min)'), cleanedValue: 0 })
        rowScore -= 10
        deliveryDuration = 0
      }
      cleansedRow.deliveryDuration = deliveryDuration

      let orderMonth = String(getMappedValue(row, 'Order Month') || '').trim()
      const monthMap: { [key: string]: string } = {
        'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April', 'may': 'May', 'jun': 'June',
        'jul': 'July', 'aug': 'August', 'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
      }
      const monthLower = orderMonth.toLowerCase()
      if (monthMap[monthLower]) orderMonth = monthMap[monthLower]
      if (!MONTHS.includes(orderMonth)) {
        orderMonth = orderTime ? orderTime.toLocaleString('en-US', { month: 'long' }) : 'Unknown'
        rowErrors.push({ row: rowNumber, column: 'Order Month', message: `Order Month tidak valid, menggunakan: ${orderMonth}`, severity: 'info', originalValue: getMappedValue(row, 'Order Month'), cleanedValue: orderMonth })
      }
      cleansedRow.orderMonth = orderMonth

      let orderHour = parseNumber(getMappedValue(row, 'Order Hour'))
      if (orderHour === null || orderHour < 0 || orderHour > 23) {
        orderHour = orderTime ? orderTime.getHours() : 0
        if (orderHour < 0 || orderHour > 23) orderHour = 0
      }
      cleansedRow.orderHour = orderHour

      let pizzaSize = String(getMappedValue(row, 'Pizza Size') || '').trim()
      const sizeLower = pizzaSize.toLowerCase()
      if (sizeLower === 'small' || sizeLower === 's') pizzaSize = 'Small'
      else if (sizeLower === 'medium' || sizeLower === 'med' || sizeLower === 'm') pizzaSize = 'Medium'
      else if (sizeLower === 'large' || sizeLower === 'l') pizzaSize = 'Large'
      else if (sizeLower === 'xl' || sizeLower === 'extra large') pizzaSize = 'XL'

      if (!PIZZA_SIZES.includes(pizzaSize)) {
        rowErrors.push({ row: rowNumber, column: 'Pizza Size', message: `Pizza Size tidak valid: "${pizzaSize}"`, severity: 'warning', originalValue: pizzaSize, cleanedValue: 'Unknown' })
        rowScore -= 5
        pizzaSize = 'Unknown'
      }
      cleansedRow.pizzaSize = pizzaSize

      let pizzaType = String(getMappedValue(row, 'Pizza Type') || '').trim()
      const typeLower = pizzaType.toLowerCase()
      if (typeLower.includes('veg') && !typeLower.includes('non')) pizzaType = 'Veg'
      else if (typeLower.includes('non') && typeLower.includes('veg')) pizzaType = 'Non-Veg'
      else if (typeLower.includes('vegan') || typeLower.includes('plant')) pizzaType = 'Vegan'
      else if (typeLower.includes('cheese') && typeLower.includes('burst')) pizzaType = 'Cheese Burst'
      else if (typeLower.includes('supreme')) pizzaType = 'Supreme'
      else if (typeLower.includes('meat') || typeLower.includes('lover')) pizzaType = 'Meat Lovers'
      else if (typeLower.includes('margherita')) pizzaType = 'Margherita'
      else if (typeLower.includes('pepperoni')) pizzaType = 'Pepperoni'
      else if (typeLower.includes('hawaiian')) pizzaType = 'Hawaiian'
      else if (typeLower.includes('bbq') || typeLower.includes('chicken')) pizzaType = 'BBQ Chicken'
      else if (typeLower.includes('seafood')) pizzaType = 'Seafood'
      else if (typeLower.includes('mushroom')) pizzaType = 'Mushroom'
      else pizzaType = 'Unknown'

      cleansedRow.pizzaType = pizzaType

      const toppingsCount = parseNumber(getMappedValue(row, 'Toppings Count')) ?? 0
      cleansedRow.toppingsCount = toppingsCount

      const pizzaComplexity = parseNumber(getMappedValue(row, 'Pizza Complexity')) ?? 0
      cleansedRow.pizzaComplexity = pizzaComplexity

      const toppingDensity = parseFloatValue(getMappedValue(row, 'Topping Density'))
      cleansedRow.toppingDensity = toppingDensity

      let distanceKm = parseFloatValue(getMappedValue(row, 'Distance (km)'))
      if (distanceKm === null || distanceKm <= 0) {
        rowErrors.push({ row: rowNumber, column: 'Distance', message: 'Distance tidak valid', severity: 'warning', originalValue: getMappedValue(row, 'Distance (km)'), cleanedValue: 5 })
        rowScore -= 5
        distanceKm = 5
      }
      cleansedRow.distanceKm = distanceKm

      let trafficLevel = String(getMappedValue(row, 'Traffic Level') || '').trim()
      const trafficLower = trafficLevel.toLowerCase()
      if (trafficLower === 'low' || trafficLower === 'l') trafficLevel = 'Low'
      else if (trafficLower === 'medium' || trafficLower === 'med' || trafficLower === 'm') trafficLevel = 'Medium'
      else if (trafficLower === 'high' || trafficLower === 'h') trafficLevel = 'High'

      if (!TRAFFIC_LEVELS.includes(trafficLevel)) {
        rowErrors.push({ row: rowNumber, column: 'Traffic Level', message: `Traffic Level tidak valid: "${trafficLevel}"`, severity: 'warning', originalValue: getMappedValue(row, 'Traffic Level'), cleanedValue: 'Unknown' })
        rowScore -= 3
        trafficLevel = 'Unknown'
      }
      cleansedRow.trafficLevel = trafficLevel

      const trafficImpact = parseNumber(getMappedValue(row, 'Traffic Impact')) ?? 1
      cleansedRow.trafficImpact = Math.min(3, Math.max(1, trafficImpact))

      cleansedRow.isPeakHour = parseBoolean(getMappedValue(row, 'Is Peak Hour'))
      cleansedRow.isWeekend = parseBoolean(getMappedValue(row, 'Is Weekend'))

      let paymentMethod = String(getMappedValue(row, 'Payment Method') || '').trim()
      const payLower = paymentMethod.toLowerCase()
      if (payLower.includes('card') || payLower.includes('credit')) paymentMethod = 'Card'
      else if (payLower.includes('cash')) paymentMethod = 'Cash'
      else if (payLower.includes('wallet') || payLower.includes('e-wallet')) paymentMethod = 'Wallet'
      else if (payLower.includes('upi') || payLower.includes('transfer')) paymentMethod = 'UPI'
      else if (payLower.includes('hut') || payLower.includes('points')) paymentMethod = 'Hut Points'

      if (!PAYMENT_METHODS.includes(paymentMethod)) {
        rowErrors.push({ row: rowNumber, column: 'Payment Method', message: `Payment Method tidak dikenali: "${paymentMethod}"`, severity: 'warning', originalValue: getMappedValue(row, 'Payment Method'), cleanedValue: 'Unknown' })
        rowScore -= 3
        paymentMethod = 'Unknown'
      }
      cleansedRow.paymentMethod = paymentMethod

      let paymentCategory = String(getMappedValue(row, 'Payment Category') || '').trim()
      const catLower = paymentCategory.toLowerCase()
      if (catLower === 'online' || catLower === 'digital') paymentCategory = 'Online'
      else if (catLower === 'offline' || catLower === 'cash') paymentCategory = 'Offline'

      if (!PAYMENT_CATEGORIES.includes(paymentCategory)) {
        paymentCategory = 'Unknown'
      }
      cleansedRow.paymentCategory = paymentCategory

      const estimatedDuration = parseFloatValue(getMappedValue(row, 'Estimated Duration (min)')) ?? 0
      cleansedRow.estimatedDuration = estimatedDuration

      const deliveryEfficiency = parseFloatValue(getMappedValue(row, 'Delivery Efficiency (min/km)'))
      cleansedRow.deliveryEfficiency = deliveryEfficiency

      const delayMin = parseFloatValue(getMappedValue(row, 'Delay (min)')) ?? 0
      cleansedRow.delayMin = delayMin

      const isDelayedExplicit = parseBoolean(getMappedValue(row, 'Is Delayed'))
      cleansedRow.isDelayed = isDelayedExplicit || delayMin > 0

      const restaurantAvgTime = parseFloatValue(getMappedValue(row, 'Restaurant Avg Time'))
      cleansedRow.restaurantAvgTime = restaurantAvgTime

      cleansedRow.qualityScore = Math.max(0, rowScore)
      cleaned.push(cleansedRow)
      totalScore += Math.max(0, rowScore)
      allErrors.push(...rowErrors)
    })

    setCleanedData(cleaned)
    setErrors(allErrors)
    setQualityScore(cleaned.length > 0 ? totalScore / cleaned.length : 0)
    setIsCleaning(false)
  }, [columnMapping, getMappedValue])

  const parseDateExcel = (value: any): Date | null => {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30)
      return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
    }
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
      const num = Number(cleaned)
      return isNaN(num) ? null : num
    }
    return Number(value)
  }

  const parseFloatValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
      return isNaN(parseFloat(cleaned)) ? null : parseFloat(cleaned)
    }
    return typeof value === 'number' ? value : null
  }

  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      return lower === 'true' || lower === 'yes' || lower === '1'
    }
    return false
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const handleUpload = async () => {
    if (!file) return
    if (!selectedRestaurant && !userRestaurantId) {
      setResult({ success: false, message: 'Pilih restoran terlebih dahulu' })
      return
    }
    setIsLoading(true)
    setResult(null)
    setUploadProgress(0)

    const isGMUploadAll = isSuperAdmin && selectedRestaurant === 'all' && !hasAssignedRestaurant

    if (isGMUploadAll) {
      // GM uploads ALL data - split by restaurant name in Excel
      const restaurantMap = new Map(restaurants.map(r => [r.name.toLowerCase(), r.id]))
      const restaurantCodeMap = new Map(restaurants.map(r => [r.code.toLowerCase(), r.id]))
      
      // Group data by restaurant
      const dataByRestaurant: Record<string, any[]> = {}
      restaurants.forEach(r => {
        dataByRestaurant[r.id] = []
      })

      cleanedData.forEach(row => {
        const rowRestoName = (row.restaurantName || '').toLowerCase()
        let matchedRestoId = null
        
        // Try match by name
        for (const [name, id] of restaurantMap) {
          if (rowRestoName.includes(name) || name.includes(rowRestoName)) {
            matchedRestoId = id
            break
          }
        }
        
        // Try match by code if not found
        if (!matchedRestoId) {
          for (const [code, id] of restaurantCodeMap) {
            if (rowRestoName.includes(code)) {
              matchedRestoId = id
              break
            }
          }
        }

        // Default to first restaurant if no match
        if (!matchedRestoId && restaurants.length > 0) {
          matchedRestoId = restaurants[0].id
        }

        if (matchedRestoId) {
          dataByRestaurant[matchedRestoId].push(row)
        }
      })

      // Upload each restaurant's data
      let totalUploaded = 0
      let totalFailed = 0

      for (const [restoId, data] of Object.entries(dataByRestaurant)) {
        if (data.length === 0) continue

        const resto = restaurants.find(r => r.id === restoId)
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: restoId,
              cleanedData: data
            })
          })
          const resData = await res.json()
          if (resData.success) {
            totalUploaded += resData.data?.validRows || data.length
          } else {
            totalFailed += data.length
          }
        } catch (e) {
          totalFailed += data.length
        }
      }

      setUploadProgress(100)
      setResult({
        success: true,
        message: `Berhasil upload ${totalUploaded} data untuk semua restoran`,
        data: {
          totalRows: cleanedData.length,
          validRows: totalUploaded,
          invalidRows: totalFailed,
          qualityScore: 100,
          errors: []
        }
      })

      setTimeout(() => checkDatabase(), 1000)
      setIsLoading(false)
      return
    }

    // Regular upload (single restaurant)
    const targetRestaurantId = userRestaurantId || selectedRestaurant
    if (!targetRestaurantId || targetRestaurantId === 'all') {
      setResult({ success: false, message: 'Pilih restoran terlebih dahulu' })
      setIsLoading(false)
      return
    }

    // Filter data for selected restaurant
    const selectedResto = restaurants.find(r => r.id === targetRestaurantId)
    const selectedRestoName = selectedResto?.name?.toLowerCase() || ''
    const filteredCleanedData = cleanedData.filter(row => {
      const rowRestaurantName = (row.restaurantName || '').toLowerCase()
      const matchByName = rowRestaurantName.includes(selectedRestoName) || selectedRestoName.includes(rowRestaurantName)
      const matchByCode = selectedResto?.code && rowRestaurantName.includes(selectedResto.code.toLowerCase())
      return matchByName || matchByCode
    })

    if (filteredCleanedData.length === 0) {
      setResult({ success: false, message: `Tidak ada data untuk restoran ${selectedResto?.name}` })
      setIsLoading(false)
      return
    }

    try {
      console.log('Sending filtered data to server, count:', filteredCleanedData.length)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: targetRestaurantId,
          cleanedData: filteredCleanedData
        })
      })
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error('Server error - please login again')
      }
      
      const data = await res.json()
      console.log('Upload response:', data)
      setUploadProgress(100)
      setResult({
        ...data,
        message: data.message + ` (${filteredCleanedData.length} baris untuk ${selectedResto?.name})`
      })

      if (data.success) {
        setTimeout(() => checkDatabase(), 1000)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setResult({ success: false, message: error.message || 'Terjadi kesalahan saat upload' })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setRawData([])
    setHeaders([])
    setCleanedData([])
    setErrors([])
    setResult(null)
    setColumnMapping({})
    setUploadProgress(0)
  }

  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = errors.filter(e => e.severity === 'warning').length

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Upload & Clean Data
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Upload Excel dengan preview cleaning otomatis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card style={{ backgroundColor: 'var(--card)' }} className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle style={{ color: 'var(--card-foreground)' }}>
              File Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isSuperAdmin && !hasAssignedRestaurant) && restaurants.length > 0 && (
              <div className="space-y-2">
                <Label style={{ color: 'var(--foreground)' }}>Restoran</Label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    <SelectValue placeholder="Pilih restoran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Restoran</SelectItem>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} ({restaurant.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasAssignedRestaurant && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                <p className="text-sm"><strong>Restoran:</strong> {restaurants.find(r => r.id === userRestaurantId)?.name || 'Loading...'}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="autoClean" checked={autoClean} onCheckedChange={(checked) => setAutoClean(checked as boolean)} />
              <label htmlFor="autoClean" className="text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
                Auto-clean saat upload
              </label>
            </div>

            <div
              {...getRootProps()}
              className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors")}
              style={{
                borderColor: isDragActive ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isDragActive ? 'var(--accent)' : 'transparent'
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
                  <FileSpreadsheet className="h-8 w-8 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--accent-foreground)' }}>{file.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeFile() }} style={{ color: 'var(--destructive)' }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ color: 'var(--foreground)' }}>{isDragActive ? 'Lepaskan file...' : 'Drag & drop Excel'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>atau klik untuk pilih</p>
                </div>
              )}
            </div>

            {isParsing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--primary)' }} />
                <span style={{ color: 'var(--foreground)' }}>Memproses file...</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isLoading || cleanedData.length === 0}
              className="w-full"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengupload...</> : <><Upload className="mr-2 h-4 w-4" /> Upload Data</>}
            </Button>
            {cleanedData.length > 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                {isSuperAdmin && selectedRestaurant === 'all' 
                  ? 'Semua data akan otomatis dipisah per restoran' 
                  : 'Data akan difilter sesuai restoran yang dipilih'}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {rawData.length > 0 ? (
            <>
              <Card style={{ backgroundColor: 'var(--card)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle style={{ color: 'var(--card-foreground)' }}>Preview & Cleaning</CardTitle>
                      <CardDescription style={{ color: 'var(--muted-foreground)' }}>
                        {rawData.length} baris • Auto-mapped {Object.keys(columnMapping).length} kolom
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowMapping(!showMapping)}>
                        <Settings className="h-4 w-4 mr-1" /> Mapping
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => cleanData(rawData)} disabled={isCleaning}>
                        <Wand2 className="h-4 w-4 mr-1" /> {isCleaning ? 'Cleaning...' : 'Re-Clean'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {showMapping && (
                    <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                      <h4 className="font-medium mb-3" style={{ color: 'var(--foreground)' }}>Column Mapping</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].map(field => (
                          <div key={field} className="flex items-center gap-2">
                            <label className="text-xs w-32 truncate" style={{ color: 'var(--foreground)' }}>{field}</label>
                            <Select value={columnMapping[field] || '__skip__'} onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field]: val === '__skip__' ? '' : val }))}>
                              <SelectTrigger className="h-7 text-xs flex-1">
                                <SelectValue placeholder="--" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__skip__">-- Skip --</SelectItem>
                                {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {missingHeaders.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Missing columns: {missingHeaders.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  <Tabs defaultValue="cleaned">
                    <TabsList className="mb-3">
                      <TabsTrigger value="cleaned" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Cleaned ({cleanedData.length})
                      </TabsTrigger>
                      <TabsTrigger value="errors" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Errors ({errorCount})
                      </TabsTrigger>
                      <TabsTrigger value="warnings" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Warnings ({warningCount})
                      </TabsTrigger>
                      <TabsTrigger value="raw" className="gap-1">
                        <Eye className="h-3 w-3" /> Raw
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cleaned">
                      {cleanedData.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Quality Score</span>
                            <span className={`text-lg font-bold ${getQualityColor(qualityScore)}`}>{qualityScore.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                            <div className="h-full transition-all duration-500" style={{ width: `${qualityScore}%`, backgroundColor: qualityScore >= 90 ? 'rgb(34, 197, 94)' : qualityScore >= 70 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)' }} />
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div className="text-center p-2 rounded" style={{ backgroundColor: 'var(--muted)' }}>
                              <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{rawData.length}</p>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total</p>
                            </div>
                            <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                              <p className="text-xl font-bold text-green-600">{cleanedData.filter(d => d.qualityScore >= 70).length}</p>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Valid</p>
                            </div>
                            <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                              <p className="text-xl font-bold text-red-500">{errorCount}</p>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Errors</p>
                            </div>
                          </div>
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ backgroundColor: 'var(--muted)' }}>
                                  <th className="p-2 text-left">Order ID</th>
                                  <th className="p-2 text-left">Size</th>
                                  <th className="p-2 text-left">Type</th>
                                  <th className="p-2 text-left">Traffic</th>
                                  <th className="p-2 text-left">Payment</th>
                                  <th className="p-2 text-right">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cleanedData.slice(0, 10).map((row, i) => (
                                  <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                                    <td className="p-2 truncate max-w-[100px]" style={{ color: 'var(--foreground)' }}>{row.orderId}</td>
                                    <td className="p-2" style={{ color: 'var(--foreground)' }}>{row.pizzaSize}</td>
                                    <td className="p-2" style={{ color: 'var(--foreground)' }}>{row.pizzaType}</td>
                                    <td className="p-2" style={{ color: 'var(--foreground)' }}>{row.trafficLevel}</td>
                                    <td className="p-2" style={{ color: 'var(--foreground)' }}>{row.paymentMethod}</td>
                                    <td className="p-2 text-right" style={{ color: row.qualityScore >= 70 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>{row.qualityScore}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center py-4" style={{ color: 'var(--muted-foreground)' }}>Klik "Re-Clean" untuk memproses data</p>
                      )}
                    </TabsContent>

                    <TabsContent value="errors">
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {errors.filter(e => e.severity === 'error').length === 0 ? (
                          <p className="text-center py-4 text-green-500">Tidak ada error!</p>
                        ) : (
                          errors.filter(e => e.severity === 'error').map((err, i) => (
                            <div key={i} className="p-2 rounded text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' }}>
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium">Baris {err.row}</span> - {err.column}: {err.message}
                                {err.originalValue !== undefined && <div className="text-xs opacity-70">Original: {String(err.originalValue)} → Cleaned: {String(err.cleanedValue)}</div>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="warnings">
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {errors.filter(e => e.severity === 'warning').length === 0 ? (
                          <p className="text-center py-4 text-green-500">Tidak ada warning!</p>
                        ) : (
                          errors.filter(e => e.severity === 'warning').slice(0, 50).map((warn, i) => (
                            <div key={i} className="p-2 rounded text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'rgb(234, 179, 8)' }}>
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium">Baris {warn.row}</span> - {warn.column}: {warn.message}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="raw">
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ backgroundColor: 'var(--muted)' }}>
                              {headers.slice(0, 8).map((h, i) => (
                                <th key={i} className="p-2 text-left whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rawData.slice(0, 10).map((row, i) => (
                              <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                                {headers.slice(0, 8).map((h, j) => (
                                  <td key={j} className="p-2 truncate max-w-[100px]" style={{ color: 'var(--foreground)' }}>{String(row[h] || '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card style={{ backgroundColor: 'var(--card)' }}>
              <CardContent className="py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Upload file Excel untuk preview dan cleaning</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card style={{ backgroundColor: 'var(--card)' }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: result.success ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                  {result.success ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                  <div><p className="font-medium">{result.message}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Status - Accordion Style */}
          <Card style={{ backgroundColor: 'var(--card)' }} className="overflow-hidden">
            <CardHeader className="py-3">
              <button 
                onClick={() => setDbAccordionOpen(!dbAccordionOpen)}
                className="w-full flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base" style={{ color: 'var(--card-foreground)' }}>Status Database</CardTitle>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Klik untuk melihat detail
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {dbStatus ? (
                    <div className="text-right">
                      <span className="text-xl font-bold" style={{ color: dbStatus.totalCount > 0 ? 'rgb(34, 197, 94)' : 'var(--foreground)' }}>
                        {dbStatus.totalCount.toLocaleString()}
                      </span>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>total data</p>
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-slate-100">
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Memuat...</span>
                    </div>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${dbAccordionOpen ? 'rotate-180' : ''}`}
                       style={{ backgroundColor: 'var(--muted)' }}>
                    <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                </div>
              </button>
            </CardHeader>
            
            {dbAccordionOpen && (
              <CardContent className="pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                {!dbStatus ? (
                  <div className="py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                    <p className="mt-2">Memuat data...</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {/* Debug Info - Collapsible */}
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-xs p-2 rounded hover:bg-slate-50" 
                                style={{ color: '#3b82f6' }}>
                        <span className="font-medium">ℹ Info Debug</span>
                      </summary>
                      <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <p>Role: {dbStatus.userRole} | Restaurant ID: {dbStatus.userRestaurantId || 'none'}</p>
                        <p>Where: {JSON.stringify(dbStatus.whereClause)}</p>
                      </div>
                    </details>

                    {dbStatus.restaurants && dbStatus.restaurants.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--foreground)' }}>
                          📊 Data per Restaurant
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {dbStatus.restaurants.map((r: any) => (
                            <div key={r.id} 
                                 className="flex items-center justify-between p-3 rounded-xl border"
                                 style={{ 
                                   backgroundColor: r.dataCount > 0 ? 'rgba(34, 197, 94, 0.05)' : 'var(--muted)',
                                   borderColor: r.dataCount > 0 ? 'rgba(34, 197, 94, 0.3)' : 'var(--border)'
                                 }}>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                     style={{ 
                                       backgroundColor: r.dataCount > 0 ? 'rgb(34, 197, 94)' : 'var(--muted-foreground)',
                                       color: r.dataCount > 0 ? 'white' : 'var(--background)'
                                     }}>
                                  {r.code}
                                </div>
                                <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                                  {r.name}
                                </span>
                              </div>
                              <span className="font-bold text-sm" style={{ 
                                color: r.dataCount > 0 ? 'rgb(34, 197, 94)' : 'var(--muted-foreground)'
                              }}>
                                {r.dataCount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dbStatus.recentData && dbStatus.recentData.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--foreground)' }}>
                          🕐 Data Terbaru (5 terbaru)
                        </h4>
                        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={{ backgroundColor: 'var(--muted)' }}>
                                <th className="p-3 text-left font-semibold">Order ID</th>
                                <th className="p-3 text-left font-semibold">Pizza</th>
                                <th className="p-3 text-left font-semibold">Location</th>
                                <th className="p-3 text-left font-semibold">Uploaded</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dbStatus.recentData.slice(0, 5).map((row: any, idx: number) => (
                                <tr key={row.id} 
                                    className="border-t"
                                    style={{ 
                                      borderColor: 'var(--border)',
                                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--muted)'
                                    }}>
                                  <td className="p-3 font-medium" style={{ color: 'var(--foreground)' }}>{row.orderId}</td>
                                  <td className="p-3" style={{ color: 'var(--foreground)' }}>{row.pizzaType}</td>
                                  <td className="p-3" style={{ color: 'var(--foreground)' }}>{row.location}</td>
                                  <td className="p-3" style={{ color: 'var(--muted-foreground)' }}>
                                    {row.uploadedAt ? new Date(row.uploadedAt).toLocaleString('id-ID') : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {dbStatus.totalCount === 0 && (
                      <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                        <Table className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Belum ada data</p>
                        <p className="text-xs">Silakan upload file Excel untuk memulai</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
