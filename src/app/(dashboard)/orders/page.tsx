'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  Loader2,
  DollarSign,
  ShoppingCart
} from 'lucide-react'

interface Transaction {
  id: string
  transactionId: string
  retailerId: number
  retailerName: string
  productId: number
  productName: string
  methodId: number
  methodName: string
  cityId: number
  cityName: string
  stateName: string
  invoiceDate: string
  pricePerUnit: number
  unitSold: number
  totalSales: number
  operatingProfit: number
  operatingMargin: number
}

interface Retailer {
  id: number
  retailer_name: string
  code: string
}

interface Product {
  id: number
  product: string
}

interface Method {
  id: number
  method: string
}

interface MasterData {
  retailers: Retailer[]
  products: Product[]
  methods: Method[]
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Transaction[]>([])
  const [masterData, setMasterData] = useState<MasterData>({ retailers: [], products: [], methods: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Transaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    retailerId: '',
    productId: '',
    methodId: '',
    cityId: '1',
    invoiceDate: new Date().toISOString().split('T')[0],
    pricePerUnit: 0,
    unitSold: 1,
    totalSales: 0,
    operatingProfit: 0,
    operatingMargin: 0
  })

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userRestaurantId = (session?.user as any)?.restaurantId
  const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isManagerOrStaff = userRole === 'MANAGER' || userRole === 'STAFF'

  useEffect(() => {
    fetchData()
  }, [selectedRetailer])

  useEffect(() => {
    if (userRestaurantId && selectedRetailer === 'all') {
      setSelectedRetailer(userRestaurantId)
    }
  }, [userRestaurantId, masterData.retailers])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ordersRes, masterRes] = await Promise.all([
        fetch(`/api/orders?restaurant=${selectedRetailer}`),
        fetch('/api/master')
      ])

      if (!ordersRes.ok) {
        const errorText = await ordersRes.text()
        console.error('Orders API error:', ordersRes.status, errorText)
        throw new Error(`Gagal memuat data pesanan (${ordersRes.status})`)
      }
      if (!masterRes.ok) {
        const errorText = await masterRes.text()
        console.error('Master API error:', masterRes.status, errorText)
        throw new Error(`Gagal memuat data master (${masterRes.status})`)
      }

      const ordersRaw = await ordersRes.json()
      const master = await masterRes.json()
      
      if (ordersRaw.error) {
        console.error('Orders error:', ordersRaw.error)
        throw new Error(ordersRaw.error)
      }
      if (master.error) {
        console.error('Master error:', master.error)
        throw new Error(master.error)
      }
      
      const ordersArray = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw?.orders || [])
      setOrders(ordersArray)
      setMasterData({
        retailers: master?.retailers || [],
        products: master?.products || [],
        methods: master?.methods || []
      })
      
      if (ordersArray.length === 0) {
        setError('Belum ada data transaksi. Silakan upload data terlebih dahulu di halaman Upload Data.')
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Terjadi kesalahan saat memuat data. Silakan cek koneksi database.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.retailerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddDialog = () => {
    setIsEditMode(false)
    setCurrentOrder(null)
    setFormData({
      retailerId: userRestaurantId || (masterData.retailers?.[0]?.id?.toString() || ''),
      productId: masterData.products?.[0]?.id?.toString() || '',
      methodId: masterData.methods?.[0]?.id?.toString() || '',
      cityId: '1',
      invoiceDate: new Date().toISOString().split('T')[0],
      pricePerUnit: 0,
      unitSold: 1,
      totalSales: 0,
      operatingProfit: 0,
      operatingMargin: 0
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (order: Transaction) => {
    setIsEditMode(true)
    setCurrentOrder(order)
    setFormData({
      retailerId: order.retailerId.toString(),
      productId: order.productId.toString(),
      methodId: order.methodId.toString(),
      cityId: order.cityId.toString(),
      invoiceDate: order.invoiceDate,
      pricePerUnit: order.pricePerUnit,
      unitSold: order.unitSold,
      totalSales: order.totalSales,
      operatingProfit: order.operatingProfit,
      operatingMargin: order.operatingMargin
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
          retailerId: formData.retailerId || userRestaurantId
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
            Data Transaksi
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Kelola data transaksi Adidas
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      <Card style={{ backgroundColor: 'var(--card)' }}>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Cari transaksi..."
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
              <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
                <SelectTrigger style={{ width: 200 }}>
                  <SelectValue placeholder="Pilih Retailer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Retailer</SelectItem>
                  {(masterData.retailers || []).map((r: any) => (
                    <SelectItem key={r.id} value={r.id?.toString()}>
                      {r.retailer_name} ({r.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {userRestaurantId && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                <span className="text-sm font-medium">
                  {(masterData.retailers || []).find(r => r.id?.toString() === userRestaurantId)?.retailer_name || 'Retailer Anda'}
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
                    <th className="text-left py-3 px-2">ID Transaksi</th>
                    <th className="text-left py-3 px-2">Retailer</th>
                    <th className="text-left py-3 px-2">Produk</th>
                    <th className="text-left py-3 px-2">Kota</th>
                    <th className="text-left py-3 px-2">Tanggal</th>
                    <th className="text-left py-3 px-2">Unit</th>
                    <th className="text-left py-3 px-2">Total Sales</th>
                    <th className="text-right py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-red-500 font-medium">{error}</p>
                          <Button 
                            variant="outline" 
                            onClick={() => router.push('/upload')}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Data
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <p style={{ color: 'var(--muted-foreground)' }}>
                            Tidak ada data transaksi. Silakan upload data terlebih dahulu.
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => router.push('/upload')}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Data
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-opacity-50">
                        <td className="py-3 px-2 font-medium">{order.transactionId}</td>
                        <td className="py-3 px-2">{order.retailerName}</td>
                        <td className="py-3 px-2">{order.productName}</td>
                        <td className="py-3 px-2">{order.cityName}</td>
                        <td className="py-3 px-2">{order.invoiceDate}</td>
                        <td className="py-3 px-2">{order.unitSold}</td>
                        <td className="py-3 px-2">Rp {order.totalSales.toLocaleString('id-ID')}</td>
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
                  {isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  {isEditMode ? 'Perbarui informasi transaksi Adidas' : 'Tambah data transaksi Adidas baru'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {/* Form Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-5">
              
              {/* Section 1: Info Utama Transaksi */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-blue-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Informasi Transaksi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Retailer</Label>
                    <Select value={formData.retailerId} onValueChange={(v) => setFormData({...formData, retailerId: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-blue-400">
                        <SelectValue placeholder="Pilih Retailer" />
                      </SelectTrigger>
                      <SelectContent>
                        {(masterData.retailers || []).map((r: any) => (
                          <SelectItem key={r.id} value={r.id?.toString()}>{r.retailer_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Produk</Label>
                    <Select value={formData.productId} onValueChange={(v) => setFormData({...formData, productId: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-blue-400">
                        <SelectValue placeholder="Pilih Produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {(masterData.products || []).map((p: any) => (
                          <SelectItem key={p.id} value={p.id?.toString()}>{p.product}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Metode</Label>
                    <Select value={formData.methodId} onValueChange={(v) => setFormData({...formData, methodId: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 focus:border-blue-400">
                        <SelectValue placeholder="Pilih Metode" />
                      </SelectTrigger>
                      <SelectContent>
                        {(masterData.methods || []).map((m: any) => (
                          <SelectItem key={m.id} value={m.id?.toString()}>{m.method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Tanggal Invoice</Label>
                    <Input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                      className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Financial Data */}
              <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-green-500"></div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Informasi Keuangan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Harga per Unit</Label>
                    <Input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({
                        ...formData, 
                        pricePerUnit: parseFloat(e.target.value) || 0,
                        totalSales: parseFloat(e.target.value) * formData.unitSold
                      })}
                      className="h-11 bg-white border-slate-200 focus:border-green-400 focus:ring-green-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Unit Terjual</Label>
                    <Input
                      type="number"
                      value={formData.unitSold}
                      onChange={(e) => setFormData({
                        ...formData, 
                        unitSold: parseInt(e.target.value) || 1,
                        totalSales: formData.pricePerUnit * (parseInt(e.target.value) || 1)
                      })}
                      className="h-11 bg-white border-slate-200 focus:border-green-400 focus:ring-green-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Total Sales</Label>
                    <Input
                      type="number"
                      value={formData.totalSales}
                      onChange={(e) => setFormData({...formData, totalSales: parseFloat(e.target.value) || 0})}
                      className="h-11 bg-white border-slate-200 focus:border-green-400 focus:ring-green-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Operating Profit</Label>
                    <Input
                      type="number"
                      value={formData.operatingProfit}
                      onChange={(e) => setFormData({
                        ...formData, 
                        operatingProfit: parseFloat(e.target.value) || 0,
                        operatingMargin: formData.totalSales > 0 ? (parseFloat(e.target.value) / formData.totalSales) * 100 : 0
                      })}
                      className="h-11 bg-white border-slate-200 focus:border-green-400 focus:ring-green-100"
                    />
                  </div>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
