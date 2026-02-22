export type Role = 'GM' | 'ADMIN_PUSAT' | 'MANAGER' | 'STAFF'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  restaurantId?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date | null
}

export interface Restaurant {
  id: string
  name: string
  code: string
  location?: string | null
  description?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SalesData {
  id: string
  retailer_id: string
  invoice_date: string
  region: string | null
  state: string | null
  city: string | null
  product: string
  price_per_unit: number | null
  units_sold: number | null
  total_sales: number
  operating_profit: number
  operating_margin: number | null
  sales_method: string | null
  uploaded_by: string
  uploaded_at: string
  validated_at: string | null
  validated_by: string | null
  quality_score: number | null
  version: number
}

export interface DashboardStats {
  totalOrders: number
  avgDeliveryTime: number
  onTimeRate: number
  avgDelay: number
  totalRestaurants: number
  ordersByMonth: { month: string; count: number }[]
  ordersByRestaurant: { restaurant: string; count: number }[]
  ordersBySize: { size: string; count: number }[]
  ordersByType: { type: string; count: number }[]
  delayRateByRestaurant: { restaurant: string; rate: number }[]
}

export interface UploadResponse {
  success: boolean
  message: string
  data?: {
    totalRows: number
    validRows: number
    invalidRows: number
    errors: ValidationError[]
  }
}

export interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface CleansedData {
  data: Partial<SalesData>[]
  errors: ValidationError[]
  qualityScore: number
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      restaurantId?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    restaurantId?: string | null
  }
}
