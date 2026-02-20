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

export interface DeliveryData {
  id: string
  orderId: string
  restaurantId: string
  location: string
  orderTime: Date
  deliveryTime: Date
  deliveryDuration: number
  orderMonth: string
  orderHour: number
  pizzaSize: string
  pizzaType: string
  toppingsCount: number
  pizzaComplexity: number
  toppingDensity?: number | null
  distanceKm: number
  trafficLevel: string
  trafficImpact: number
  isPeakHour: boolean
  isWeekend: boolean
  paymentMethod: string
  paymentCategory: string
  estimatedDuration: number
  deliveryEfficiency?: number | null
  delayMin: number
  isDelayed: boolean
  restaurantAvgTime?: number | null
  uploadedBy: string
  uploadedAt: Date
  validatedAt?: Date | null
  validatedBy?: string | null
  qualityScore?: number | null
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
  data: Partial<DeliveryData>[]
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
