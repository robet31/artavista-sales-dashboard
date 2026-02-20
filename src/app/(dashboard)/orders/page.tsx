'use client'

import { useState, useEffect } from 'react'
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2
} from 'lucide-react'

interface Order {
  id: string
  orderId: string
  location: string
  orderTime: string
  deliveryTime: string
  deliveryDuration: number
  orderMonth: string
  orderHour: number
  pizzaSize: string
  pizzaType: string
  toppingsCount: number
  distanceKm: number
  trafficLevel: string
  paymentMethod: string
  isPeakHour: boolean
  isWeekend: boolean
  isDelayed: boolean
}

interface Restaurant {
  id: string
  name: string
  code: string
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    orderId: '',
    location: '',
    orderTime: '',
    deliveryTime: '',
    deliveryDuration: 30,
    orderMonth: 'January',
    orderHour: 12,
    pizzaSize: 'Medium',
    pizzaType: 'Margherita',
    toppingsCount: 2,
    distanceKm: 5,
    trafficLevel: 'Medium',
    paymentMethod: 'Cash',
    isPeakHour: false,
    isWeekend: false,
    isDelayed: false,
    restaurantId: ''
  })

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userRestaurantId = (session?.user as any)?.restaurantId
  const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isManagerOrStaff = userRole === 'MANAGER' || userRole === 'STAFF'

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [selectedRestaurant])

  useEffect(() => {
    if (userRestaurantId && selectedRestaurant === 'all') {
      setSelectedRestaurant(userRestaurantId)
    }
  }, [userRestaurantId, restaurants])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [ordersRes, restaurantsRes] = await Promise.all([
        fetch(`/api/orders?restaurant=${selectedRestaurant}`),
        fetch('/api/upload')
      ])

      const ordersData = await ordersRes.json()
      const restaurantsData = await restaurantsRes.json()

      setOrders(ordersData)
      setRestaurants(restaurantsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.pizzaType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddDialog = () => {
    setIsEditMode(false)
    setCurrentOrder(null)
    setFormData({
      orderId: `ORD${Date.now()}`,
      location: '',
      orderTime: new Date().toISOString().slice(0, 16),
      deliveryTime: new Date(Date.now() + 30*60000).toISOString().slice(0, 16),
      deliveryDuration: 30,
      orderMonth: 'January',
      orderHour: new Date().getHours(),
      pizzaSize: 'Medium',
      pizzaType: 'Margherita',
      toppingsCount: 2,
      distanceKm: 5,
      trafficLevel: 'Medium',
      paymentMethod: 'Cash',
      isPeakHour: false,
      isWeekend: false,
      isDelayed: false,
      restaurantId: userRestaurantId || (restaurants[0]?.id || '')
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (order: Order) => {
    setIsEditMode(true)
    setCurrentOrder(order)
    setFormData({
      orderId: order.orderId,
      location: order.location,
      orderTime: new Date(order.orderTime).toISOString().slice(0, 16),
      deliveryTime: new Date(order.deliveryTime).toISOString().slice(0, 16),
      deliveryDuration: order.deliveryDuration,
      orderMonth: order.orderMonth,
      orderHour: order.orderHour,
      pizzaSize: order.pizzaSize,
      pizzaType: order.pizzaType,
      toppingsCount: order.toppingsCount,
      distanceKm: order.distanceKm,
      trafficLevel: order.trafficLevel,
      paymentMethod: order.paymentMethod,
      isPeakHour: order.isPeakHour,
      isWeekend: order.isWeekend,
      isDelayed: order.isDelayed,
      restaurantId: ''
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const method = isEditMode ? 'PUT' : 'POST'
      const url = isEditMode ? `/api/orders?id=${currentOrder?.id}` : '/api/orders'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurantId: userRestaurantId || formData.restaurantId
        })
      })

      if (res.ok) {
        setIsDialogOpen(false)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menyimpan data')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus order ini?')) return

    try {
      const res = await fetch(`/api/orders?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Gagal menghapus data')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Terjadi kesalahan')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Data Order
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Kelola data order pizza
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Order
        </Button>
      </div>

      <Card style={{ backgroundColor: 'var(--card)' }}>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Cari order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ 
                  backgroundColor: 'var(--input)',
                  borderColor: 'var(--border)'
                }}
              />
            </div>
            {(isSuperAdmin || isManagerOrStaff) && !userRestaurantId && (
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger style={{ width: 200 }}>
                  <SelectValue placeholder="Pilih Restoran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Restoran</SelectItem>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {userRestaurantId && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                <span className="text-sm font-medium">
                  {restaurants.find(r => r.id === userRestaurantId)?.name || 'Restoran Anda'}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Order ID</th>
                    <th className="text-left py-3 px-2">Location</th>
                    <th className="text-left py-3 px-2">Pizza</th>
                    <th className="text-left py-3 px-2">Size</th>
                    <th className="text-left py-3 px-2">Distance</th>
                    <th className="text-left py-3 px-2">Payment</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-opacity-50">
                        <td className="py-3 px-2 font-medium">{order.orderId}</td>
                        <td className="py-3 px-2">{order.location}</td>
                        <td className="py-3 px-2">{order.pizzaType}</td>
                        <td className="py-3 px-2">{order.pizzaSize}</td>
                        <td className="py-3 px-2">{order.distanceKm} km</td>
                        <td className="py-3 px-2">{order.paymentMethod}</td>
                        <td className="py-3 px-2">
                          {order.isDelayed ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Terlambat</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(order)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(order.id)}
                              style={{ color: 'var(--destructive)' }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col" onClose={() => setIsDialogOpen(false)}>
          {/* Header */}
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  {isEditMode ? 'Edit Order' : 'Tambah Order Baru'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  {isEditMode ? 'Perbarui informasi order pizza' : 'Tambah data order pizza baru'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {/* Form Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-5">
              
              {/* Section 1: Info Utama */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-blue-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Informasi Utama</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Order ID</Label>
                    <Input
                      value={formData.orderId}
                      onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                      placeholder="ORD001"
                      className="h-11 bg-white border-slate-200 focus:border-orange-400 focus:ring-orange-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Lokasi</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Jakarta"
                      className="h-11 bg-white border-slate-200 focus:border-orange-400 focus:ring-orange-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Bulan</Label>
                    <Select value={formData.orderMonth} onValueChange={(v) => setFormData({...formData, orderMonth: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Waktu */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-blue-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Waktu Pengiriman</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Jam Order</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.orderHour}
                      onChange={(e) => setFormData({...formData, orderHour: parseInt(e.target.value)})}
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Waktu Order</Label>
                    <Input
                      type="datetime-local"
                      value={formData.orderTime}
                      onChange={(e) => setFormData({...formData, orderTime: e.target.value})}
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Waktu Delivery</Label>
                    <Input
                      type="datetime-local"
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Durasi (menit)</Label>
                    <Input
                      type="number"
                      value={formData.deliveryDuration}
                      onChange={(e) => setFormData({...formData, deliveryDuration: parseInt(e.target.value)})}
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Peak Hour</Label>
                    <Select value={formData.isPeakHour ? 'true' : 'false'} onValueChange={(v) => setFormData({...formData, isPeakHour: v === 'true'})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Tidak</SelectItem>
                        <SelectItem value="true">Ya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Weekend</Label>
                    <Select value={formData.isWeekend ? 'true' : 'false'} onValueChange={(v) => setFormData({...formData, isWeekend: v === 'true'})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Tidak</SelectItem>
                        <SelectItem value="true">Ya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 3: Pizza */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-pink-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Informasi Pizza</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Ukuran Pizza</Label>
                    <Select value={formData.pizzaSize} onValueChange={(v) => setFormData({...formData, pizzaSize: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-pink-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Small','Medium','Large','XL'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Jenis Pizza</Label>
                    <Select value={formData.pizzaType} onValueChange={(v) => setFormData({...formData, pizzaType: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-pink-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Margherita','Pepperoni','Cheese Burst','Supreme','Meat Lovers','Veg','Non-Veg','BBQ Chicken','Hawaiian'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Jumlah Topping</Label>
                    <Input
                      type="number"
                      value={formData.toppingsCount}
                      onChange={(e) => setFormData({...formData, toppingsCount: parseInt(e.target.value)})}
                      className="h-11 bg-white border-slate-200 focus:border-pink-400 focus:ring-pink-100"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Delivery */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-green-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Informasi Delivery</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Jarak (km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({...formData, distanceKm: parseFloat(e.target.value)})}
                      className="h-11 bg-white border-slate-200 focus:border-green-400 focus:ring-green-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Tingkat Lalu Lintas</Label>
                    <Select value={formData.trafficLevel} onValueChange={(v) => setFormData({...formData, trafficLevel: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-green-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Low','Medium','High'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Status Delivery</Label>
                    <Select value={formData.isDelayed ? 'true' : 'false'} onValueChange={(v) => setFormData({...formData, isDelayed: v === 'true'})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-green-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Normal</SelectItem>
                        <SelectItem value="true">Terlambat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Metode Pembayaran</Label>
                    <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-green-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Cash','Card','Wallet','UPI'].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(!userRestaurantId && isSuperAdmin) && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Restaurant</Label>
                      <Select value={formData.restaurantId} onValueChange={(v) => setFormData({...formData, restaurantId: v})}>
                        <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-green-400">
                          <SelectValue placeholder="Pilih Restoran" />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-slate-200 bg-slate-50 px-6 py-4 -mx-6 -mb-4 rounded-b-2xl">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="px-6 h-11 border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
