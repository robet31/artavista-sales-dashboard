import { supabase } from './supabase'

export interface Transaction {
  id_transaction: number
  id_retailer: number
  id_product: number
  id_method: number
  id_city: number
  id_upload: number | null
  invoice_date: string
  price_per_unit: number
  unit_sold: number
  total_sales: number
  operating_profit: number
  operating_margin: number
}

export interface PizzaDeliveryData {
  id: string
  order_id: string
  restaurant_id: string
  location: string
  order_time: string
  delivery_time: string
  delivery_duration: number | null
  order_month: string | null
  order_hour: number | null
  pizza_size: string | null
  pizza_type: string | null
  toppings_count: number | null
  pizza_complexity: number | null
  topping_density: number | null
  distance_km: number | null
  traffic_level: string | null
  traffic_impact: number | null
  is_peak_hour: boolean | null
  is_weekend: boolean | null
  payment_method: string | null
  payment_category: string | null
  estimated_duration: number | null
  delivery_efficiency: number | null
  delay_min: number | null
  is_delayed: boolean | null
  restaurant_avg_time: number | null
}

export const salesService = {
  async getAll(limit = 1000, offset = 0) {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .eq('id_transaction', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(record: Omit<Transaction, 'id_transaction'>) {
    const { data, error } = await supabase
      .from('transaction')
      .insert([record])
      .select()
    
    if (error) throw error
    return data
  },

  async createBatch(records: Omit<Transaction, 'id_transaction'>[]) {
    const { data, error } = await supabase
      .from('transaction')
      .insert(records)
      .select()
    
    if (error) throw error
    return data
  },

  async count() {
    const { count, error } = await supabase
      .from('transaction')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count
  },

  async getWithDetails(limit = 1000, offset = 0) {
    const { data, error } = await supabase
      .from('transaction')
      .select(`
        *,
        retailer!inner(retailer_name),
        product!inner(product),
        method!inner(method),
        city!inner(city, state!inner(state))
      `)
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  },

  async getSalesSummary() {
    const { data, error } = await supabase
      .from('transaction')
      .select(`
        total_sales,
        operating_profit,
        operating_margin,
        product!inner(product),
        retailer!inner(retailer_name),
        method!inner(method)
      `)
    
    if (error) throw error
    
    const summary = {
      totalRevenue: 0,
      totalProfit: 0,
      totalTransactions: data?.length || 0,
      avgOrderValue: 0,
      byProduct: {} as Record<string, { count: number; revenue: number }>,
      byRetailer: {} as Record<string, { count: number; revenue: number }>,
      byMethod: {} as Record<string, { count: number; revenue: number }>
    }
    
    for (const row of data || []) {
      summary.totalRevenue += row.total_sales || 0
      summary.totalProfit += row.operating_profit || 0
      
      const product = (row as any).product?.product || 'Unknown'
      if (!summary.byProduct[product]) {
        summary.byProduct[product] = { count: 0, revenue: 0 }
      }
      summary.byProduct[product].count++
      summary.byProduct[product].revenue += row.total_sales || 0
      
      const retailer = (row as any).retailer?.retailer_name || 'Unknown'
      if (!summary.byRetailer[retailer]) {
        summary.byRetailer[retailer] = { count: 0, revenue: 0 }
      }
      summary.byRetailer[retailer].count++
      summary.byRetailer[retailer].revenue += row.total_sales || 0
      
      const method = (row as any).method?.method || 'Unknown'
      if (!summary.byMethod[method]) {
        summary.byMethod[method] = { count: 0, revenue: 0 }
      }
      summary.byMethod[method].count++
      summary.byMethod[method].revenue += row.total_sales || 0
    }
    
    summary.avgOrderValue = summary.totalRevenue / (summary.totalTransactions || 1)
    
    return summary
  },

  async getUploadHistory(limit = 50) {
    const { data, error } = await supabase
      .from('upload_history')
      .select('*')
      .order('uploaded_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async createUploadHistory(record: {
    file_name: string
    system_name: string
    status: string
    note?: string
    total_rows: number
    uploaded_by: string
  }) {
    const { data, error } = await supabase
      .from('upload_history')
      .insert([record])
      .select()
    
    if (error) throw error
    return data
  },

  async getMasterData() {
    const [retailers, products, methods, cities, states] = await Promise.all([
      supabase.from('retailer').select('*').order('retailer_name'),
      supabase.from('product').select('*').order('product'),
      supabase.from('method').select('*').order('method'),
      supabase.from('city').select('*, state(*)').order('city'),
      supabase.from('state').select('*').order('state')
    ])

    return {
      retailers: retailers.data || [],
      products: products.data || [],
      methods: methods.data || [],
      cities: cities.data || [],
      states: states.data || []
    }
  },

  async getDashboardStats() {
    const { data: transactions, error } = await supabase
      .from('transaction')
      .select(`
        *,
        retailer!inner(retailer_name),
        product!inner(product),
        method!inner(method),
        city!inner(city, state!inner(state))
      `)
    
    if (error) throw error

    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_sales || 0), 0) || 0
    const totalProfit = transactions?.reduce((sum, t) => sum + (t.operating_profit || 0), 0) || 0
    const totalUnits = transactions?.reduce((sum, t) => sum + (t.unit_sold || 0), 0) || 0
    const totalTransactions = transactions?.length || 0

    const byProduct: Record<string, { units: number; revenue: number; profit: number }> = {}
    const byRetailer: Record<string, { units: number; revenue: number; profit: number }> = {}
    const byMethod: Record<string, { units: number; revenue: number; profit: number }> = {}
    const byMonth: Record<string, { units: number; revenue: number; profit: number }> = {}
    const byCity: Record<string, { units: number; revenue: number }> = {}
    const byState: Record<string, { units: number; revenue: number }> = {}

    for (const t of transactions || []) {
      const productName = (t as any).product?.product || 'Unknown'
      const retailerName = (t as any).retailer?.retailer_name || 'Unknown'
      const methodName = (t as any).method?.method || 'Unknown'
      const cityName = (t as any).city?.city || 'Unknown'
      const stateName = (t as any).city?.state?.state || 'Unknown'
      const month = t.invoice_date ? t.invoice_date.substring(0, 7) : 'Unknown'

      if (!byProduct[productName]) byProduct[productName] = { units: 0, revenue: 0, profit: 0 }
      byProduct[productName].units += t.unit_sold || 0
      byProduct[productName].revenue += t.total_sales || 0
      byProduct[productName].profit += t.operating_profit || 0

      if (!byRetailer[retailerName]) byRetailer[retailerName] = { units: 0, revenue: 0, profit: 0 }
      byRetailer[retailerName].units += t.unit_sold || 0
      byRetailer[retailerName].revenue += t.total_sales || 0
      byRetailer[retailerName].profit += t.operating_profit || 0

      if (!byMethod[methodName]) byMethod[methodName] = { units: 0, revenue: 0, profit: 0 }
      byMethod[methodName].units += t.unit_sold || 0
      byMethod[methodName].revenue += t.total_sales || 0
      byMethod[methodName].profit += t.operating_profit || 0

      if (!byMonth[month]) byMonth[month] = { units: 0, revenue: 0, profit: 0 }
      byMonth[month].units += t.unit_sold || 0
      byMonth[month].revenue += t.total_sales || 0
      byMonth[month].profit += t.operating_profit || 0

      if (!byCity[cityName]) byCity[cityName] = { units: 0, revenue: 0 }
      byCity[cityName].units += t.unit_sold || 0
      byCity[cityName].revenue += t.total_sales || 0

      if (!byState[stateName]) byState[stateName] = { units: 0, revenue: 0 }
      byState[stateName].units += t.unit_sold || 0
      byState[stateName].revenue += t.total_sales || 0
    }

    const productData = Object.entries(byProduct).map(([name, data]) => ({
      label: name,
      value: data.units,
      revenue: data.revenue,
      profit: data.profit
    })).sort((a, b) => b.value - a.value)

    const retailerData = Object.entries(byRetailer).map(([name, data]) => ({
      label: name,
      value: data.revenue,
      units: data.units
    })).sort((a, b) => b.value - a.value)

    const methodData = Object.entries(byMethod).map(([name, data]) => ({
      label: name,
      value: data.revenue
    })).sort((a, b) => b.value - a.value)

    const monthlyData = Object.entries(byMonth).map(([month, data]) => ({
      label: month,
      value: data.revenue,
      units: data.units
    })).sort((a, b) => a.label.localeCompare(b.label))

    const cityData = Object.entries(byCity).map(([name, data]) => ({
      label: name,
      value: data.revenue
    })).sort((a, b) => b.value - a.value).slice(0, 10)

    const stateData = Object.entries(byState).map(([name, data]) => ({
      label: name,
      value: data.revenue
    })).sort((a, b) => b.value - a.value)

    return {
      totalRevenue,
      totalProfit,
      totalUnits,
      totalTransactions,
      avgOrderValue: totalRevenue / (totalTransactions || 1),
      avgMargin: (totalProfit / (totalRevenue || 1)) * 100,
      byProduct: productData,
      byRetailer: retailerData,
      byMethod: methodData,
      byMonth: monthlyData,
      byCity: cityData,
      byState: stateData
    }
  },

  async getPizzaDeliveryStats() {
    const { data: deliveries, error } = await supabase
      .from('delivery_data')
      .select('*')
    
    if (error) throw error

    const totalOrders = deliveries?.length || 0
    const delayedOrders = deliveries?.filter(d => d.is_delayed).length || 0
    const onTimeOrders = totalOrders - delayedOrders
    
    const byMonth: Record<string, { orders: number }> = {}
    const byPizzaSize: Record<string, { count: number }> = {}
    const byPizzaType: Record<string, { count: number }> = {}
    const byPaymentMethod: Record<string, { count: number }> = {}
    const byRestaurant: Record<string, { orders: number }> = {}
    const byTrafficLevel: Record<string, { orders: number; delayed: number }> = {}
    const byHour: Record<number, { orders: number }> = {}

    for (const d of deliveries || []) {
      if (d.order_month) {
        if (!byMonth[d.order_month]) byMonth[d.order_month] = { orders: 0 }
        byMonth[d.order_month].orders += 1
      }

      if (d.pizza_size) {
        if (!byPizzaSize[d.pizza_size]) byPizzaSize[d.pizza_size] = { count: 0 }
        byPizzaSize[d.pizza_size].count += 1
      }

      if (d.pizza_type) {
        if (!byPizzaType[d.pizza_type]) byPizzaType[d.pizza_type] = { count: 0 }
        byPizzaType[d.pizza_type].count += 1
      }

      if (d.payment_method) {
        if (!byPaymentMethod[d.payment_method]) byPaymentMethod[d.payment_method] = { count: 0 }
        byPaymentMethod[d.payment_method].count += 1
      }

      if (d.restaurant_id) {
        if (!byRestaurant[d.restaurant_id]) byRestaurant[d.restaurant_id] = { orders: 0 }
        byRestaurant[d.restaurant_id].orders += 1
      }

      if (d.traffic_level) {
        if (!byTrafficLevel[d.traffic_level]) byTrafficLevel[d.traffic_level] = { orders: 0, delayed: 0 }
        byTrafficLevel[d.traffic_level].orders += 1
        if (d.is_delayed) byTrafficLevel[d.traffic_level].delayed += 1
      }

      if (d.order_hour !== null) {
        if (!byHour[d.order_hour]) byHour[d.order_hour] = { orders: 0 }
        byHour[d.order_hour].orders += 1
      }
    }

    const monthlyData = Object.entries(byMonth).map(([month, data]) => ({
      label: month,
      value: data.orders
    })).sort((a, b) => a.label.localeCompare(b.label))

    const pizzaSizeData = Object.entries(byPizzaSize).map(([size, data]) => ({
      label: size,
      value: data.count
    })).sort((a, b) => b.value - a.value)

    const pizzaTypeData = Object.entries(byPizzaType).map(([type, data]) => ({
      label: type,
      value: data.count
    })).sort((a, b) => b.value - a.value)

    const paymentMethodData = Object.entries(byPaymentMethod).map(([method, data]) => ({
      label: method,
      value: data.count
    })).sort((a, b) => b.value - a.value)

    const restaurantData = Object.entries(byRestaurant).map(([restaurant, data]) => ({
      label: restaurant,
      value: data.orders
    })).sort((a, b) => b.value - a.value).slice(0, 10)

    const trafficData = Object.entries(byTrafficLevel).map(([level, data]) => ({
      label: level,
      value: data.orders,
      delayRate: data.orders > 0 ? (data.delayed / data.orders) * 100 : 0
    }))

    const hourData = Object.entries(byHour).map(([hour, data]) => ({
      label: hour,
      value: data.orders
    })).sort((a, b) => Number(a.label) - Number(b.label))

    return {
      totalOrders,
      delayedOrders,
      onTimeOrders,
      onTimeRate: totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0,
      byMonth: monthlyData,
      byPizzaSize: pizzaSizeData,
      byPizzaType: pizzaTypeData,
      byPaymentMethod: paymentMethodData,
      byRestaurant: restaurantData,
      byTrafficLevel: trafficData,
      byHour: hourData
    }
  }
}
