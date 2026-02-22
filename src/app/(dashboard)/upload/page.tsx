'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Upload, FileSpreadsheet, Loader2, RefreshCw, Filter, X, Database, Table, ChevronDown, ChevronRight, History, User, Clock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface PreviewRow {
  Retailer: string
  'Invoice Date': string
  State: string
  City: string
  Product: string
  'Price per Unit': number
  'Units Sold': number
  'Total Sales': number
  'Operating Profit': number
  'Operating Margin': number
  'Sales Method': string
}

interface FilterOptions {
  retailers: string[]
  products: string[]
  states: string[]
  cities: string[]
  methods: string[]
}

interface DatabaseStats {
  totalTransactions: number
  totalRetailers: number
  totalProducts: number
  totalCities: number
}

interface UploadLog {
  id: number
  file_name: string
  system_name: string
  status: string
  total_rows: number
  uploaded_by: string
  uploaded_date: string
}

const DATABASE_COLUMNS = [
  { name: 'Retailer', description: 'Nama retailer/outlet', category: 'Master Data' },
  { name: 'Invoice Date', description: 'Tanggal transaksi', category: 'Transaksi' },
  { name: 'State', description: 'Provinsi', category: 'Lokasi' },
  { name: 'City', description: 'Kota', category: 'Lokasi' },
  { name: 'Product', description: 'Nama produk', category: 'Master Data' },
  { name: 'Price per Unit', description: 'Harga per unit', category: 'Transaksi' },
  { name: 'Units Sold', description: 'Jumlah unit terjual', category: 'Transaksi' },
  { name: 'Total Sales', description: 'Total penjualan', category: 'Transaksi' },
  { name: 'Operating Profit', description: 'Keuntungan operasi', category: 'Transaksi' },
  { name: 'Operating Margin', description: 'Margin operasi (%)', category: 'Transaksi' },
  { name: 'Sales Method', description: 'Metode penjualan', category: 'Master Data' },
]

const COLUMN_CATEGORIES = ['Semua', 'Master Data', 'Transaksi', 'Lokasi']

export default function UploadPage() {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [isLoadingDb, setIsLoadingDb] = useState(true)
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  
  const [cleanedData, setCleanedData] = useState<PreviewRow[]>([])
  const [allData, setAllData] = useState<PreviewRow[]>([])

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    retailers: [],
    products: [],
    states: [],
    cities: [],
    methods: []
  })

  const [selectedFilters, setSelectedFilters] = useState<{
    retailer: string
    product: string
    state: string
    city: string
    method: string
  }>({
    retailer: 'all',
    product: 'all',
    state: 'all',
    city: 'all',
    method: 'all'
  })

  const [uploadMode, setUploadMode] = useState<'all' | 'filtered'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnDrilldown, setShowColumnDrilldown] = useState(false)
  const [showUploadLog, setShowUploadLog] = useState(false)
  const [selectedColumnCategory, setSelectedColumnCategory] = useState('Semua')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Master Data', 'Transaksi', 'Lokasi'])

  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    const checkBackend = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      try {
        const res = await fetch(`${backendUrl}/api/v1/adidas/test`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })
        if (res.ok) {
          setBackendStatus('online')
        } else {
          setBackendStatus('offline')
        }
      } catch (err) {
        console.error('Backend check error:', err)
        setBackendStatus('offline')
      }
    }
    checkBackend()
  }, [])

  useEffect(() => {
    const fetchDbStats = async () => {
      setIsLoadingDb(true)
      try {
        const res = await fetch('/api/v1/analytics-data/all-data')
        const data = await res.json()
        
        if (data.stats) {
          setDbStats({
            totalTransactions: data.stats.transactions || 0,
            totalRetailers: data.stats.retailers || 0,
            totalProducts: data.stats.products || 0,
            totalCities: data.stats.cities || 0
          })
        } else if (data.success && data.data && data.data.length > 0) {
          const retailers = new Set(data.data.map((t: any) => t.retailer_name).filter(Boolean))
          const products = new Set(data.data.map((t: any) => t.product).filter(Boolean))
          const cities = new Set(data.data.map((t: any) => t.city).filter(Boolean))
          setDbStats({
            totalTransactions: data.data.length,
            totalRetailers: retailers.size,
            totalProducts: products.size,
            totalCities: cities.size
          })
        } else {
          setDbStats({
            totalTransactions: 0,
            totalRetailers: 0,
            totalProducts: 0,
            totalCities: 0
          })
        }
      } catch (err) {
        console.error('Error fetching db stats:', err)
        setDbStats({
          totalTransactions: 0,
          totalRetailers: 0,
          totalProducts: 0,
          totalCities: 0
        })
      } finally {
        setIsLoadingDb(false)
      }
    }
    fetchDbStats()
  }, [])

  useEffect(() => {
    const fetchUploadLogs = async () => {
      setIsLoadingLogs(true)
      try {
        const res = await fetch('/api/upload/history')
        const data = await res.json()
        if (data.success && data.logs) {
          setUploadLogs(data.logs)
        }
      } catch (err) {
        console.error('Error fetching upload logs:', err)
      } finally {
        setIsLoadingLogs(false)
      }
    }
    fetchUploadLogs()
  }, [result])

  const applyFilters = (data: PreviewRow[]): PreviewRow[] => {
    return data.filter(row => {
      if (selectedFilters.retailer !== 'all' && row.Retailer !== selectedFilters.retailer) return false
      if (selectedFilters.product !== 'all' && row.Product !== selectedFilters.product) return false
      if (selectedFilters.state !== 'all' && row.State !== selectedFilters.state) return false
      if (selectedFilters.city !== 'all' && row.City !== selectedFilters.city) return false
      if (selectedFilters.method !== 'all' && row['Sales Method'] !== selectedFilters.method) return false
      return true
    })
  }

  const extractFilterOptions = (data: PreviewRow[]) => {
    const options: FilterOptions = {
      retailers: [...new Set(data.map(r => r.Retailer).filter(Boolean))].sort(),
      products: [...new Set(data.map(r => r.Product).filter(Boolean))].sort(),
      states: [...new Set(data.map(r => r.State).filter(Boolean))].sort(),
      cities: [...new Set(data.map(r => r.City).filter(Boolean))].sort(),
      methods: [...new Set(data.map(r => r['Sales Method']).filter(Boolean))].sort()
    }
    setFilterOptions(options)
  }

  const activeFiltersCount = Object.values(selectedFilters).filter(v => v !== 'all').length

  const clearFilters = () => {
    setSelectedFilters({
      retailer: 'all',
      product: 'all',
      state: 'all',
      city: 'all',
      method: 'all'
    })
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const filteredColumns = selectedColumnCategory === 'Semua' 
    ? DATABASE_COLUMNS 
    : DATABASE_COLUMNS.filter(col => col.category === selectedColumnCategory)

  const columnsByCategory = filteredColumns.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = []
    acc[col.category].push(col)
    return acc
  }, {} as Record<string, typeof DATABASE_COLUMNS>)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      setIsParsing(true)
      setResult(null)
      setCleanedData([])
      setAllData([])
      clearFilters()

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      try {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const previewRes = await fetch(`${backendUrl}/api/v1/adidas/preview`, {
          method: 'POST',
          body: formData }
        )

        if (!previewRes.ok) {
          const errorText = await previewRes.text()
          throw new Error(`Backend error (${previewRes.status}): ${errorText}`)
        }

        const data = await previewRes.json()
        
        if (data.status === 'success') {
          const cleaned = data.preview || []
          setAllData(cleaned)
          setCleanedData(cleaned)
          extractFilterOptions(cleaned)
          
          setResult({
            success: true,
            message: `✓ Preview selesai! ${cleaned.length} baris siap diupload`
          })
        }
      } catch (error: any) {
        console.error('Preview error:', error)
        setResult({
          success: false,
          message: `Error: ${error.message}. Pastikan backend server berjalan di ${backendUrl}`
        })
      } finally {
        setIsParsing(false)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const handleApplyFilters = () => {
    const filtered = applyFilters(allData)
    setCleanedData(filtered)
    setUploadMode('filtered')
    setResult({
      success: true,
      message: `✓ Filter diterapkan! ${filtered.length} baris akan diupload`
    })
  }

  const handleUploadAll = () => {
    setCleanedData(allData)
    setUploadMode('all')
    setResult({
      success: true,
      message: `✓ Mode: Upload semua ${allData.length} baris`
    })
  }

  const handleUpload = async () => {
    if (!file) return
    setIsLoading(true)
    setResult(null)
    setUploadProgress(20)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

    try {
      const formData = new FormData()
      formData.append('file', file)

      if (uploadMode === 'filtered') {
        formData.append('filtered', 'true')
        formData.append('retailer', selectedFilters.retailer)
        formData.append('product', selectedFilters.product)
        formData.append('state', selectedFilters.state)
        formData.append('city', selectedFilters.city)
        formData.append('method', selectedFilters.method)
      }

      setUploadProgress(50)
      
      const res = await fetch(`${backendUrl}/api/v1/adidas/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Upload failed: ${errorText}`)
      }
      
      const data = await res.json()
      console.log('Upload response:', data)
      
      setUploadProgress(100)
      setResult({
        success: data.status === 'success',
        message: data.message || `Berhasil upload ${data.saved} baris data`
      })

    } catch (error: any) {
      console.error('Upload error:', error)
      setResult({ 
        success: false, 
        message: error.message || 'Terjadi kesalahan saat upload' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setCleanedData([])
    setAllData([])
    setResult(null)
    setUploadMode('all')
    clearFilters()
    setFilterOptions({ retailers: [], products: [], states: [], cities: [], methods: [] })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Data Adidas</h1>
        <p className="text-gray-500">Upload file Excel untuk import data penjualan</p>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" /> Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDb ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{dbStats?.totalTransactions?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Table className="w-4 h-4" /> Total Retailer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDb ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{dbStats?.totalRetailers || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDb ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{dbStats?.totalProducts || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Kota</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDb ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">{dbStats?.totalCities || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backend Status */}
      <Card className="mt-4 bg-slate-50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status Backend:</span>
              {backendStatus === 'checking' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Memeriksa...
                </Badge>
              )}
              {backendStatus === 'online' && (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
              {backendStatus === 'offline' && (
                <Badge variant="destructive" className="bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline - Pastikan backend running di port 8000
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Log */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Riwayat Upload Data
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUploadLog(!showUploadLog)}
            >
              {showUploadLog ? 'Sembunyikan' : 'Tampilkan'}
            </Button>
          </div>
        </CardHeader>
        {showUploadLog && (
          <CardContent>
            {isLoadingLogs ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : uploadLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada riwayat upload</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">File</th>
                      <th className="p-3 text-left">System</th>
                      <th className="p-3 text-right">Rows</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Diupload Oleh</th>
                      <th className="p-3 text-left">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{log.file_name}</td>
                        <td className="p-3">{log.system_name}</td>
                        <td className="p-3 text-right">{log.total_rows?.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {log.uploaded_by}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            {new Date(log.uploaded_date).toLocaleString('id-ID')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Lepaskan file...' : 'Drag & drop file Excel'}
              </p>
              <p className="text-sm text-gray-500 mt-1">atau klik untuk pilih file</p>
              <p className="text-xs text-gray-400 mt-2">Format: .xlsx, .xls</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="outline" onClick={removeFile} className="text-red-500 border-red-200 hover:bg-red-50">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {isParsing && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Memproses data...</p>
                </div>
              )}

              {/* Filter Section */}
              {allData.length > 0 && !isParsing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Filter Data</span>
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {activeFiltersCount} filter aktif
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Retailer</label>
                        <Select 
                          value={selectedFilters.retailer} 
                          onValueChange={(v) => setSelectedFilters({...selectedFilters, retailer: v})}
                        >
                          <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Retailer</SelectItem>
                            {filterOptions.retailers.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Product</label>
                        <Select 
                          value={selectedFilters.product} 
                          onValueChange={(v) => setSelectedFilters({...selectedFilters, product: v})}
                        >
                          <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Product</SelectItem>
                            {filterOptions.products.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">State</label>
                        <Select 
                          value={selectedFilters.state} 
                          onValueChange={(v) => setSelectedFilters({...selectedFilters, state: v})}
                        >
                          <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua State</SelectItem>
                            {filterOptions.states.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">City</label>
                        <Select 
                          value={selectedFilters.city} 
                          onValueChange={(v) => setSelectedFilters({...selectedFilters, city: v})}
                        >
                          <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua City</SelectItem>
                            {filterOptions.cities.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Method</label>
                        <Select 
                          value={selectedFilters.method} 
                          onValueChange={(v) => setSelectedFilters({...selectedFilters, method: v})}
                        >
                          <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Method</SelectItem>
                            {filterOptions.methods.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {showFilters && (
                    <div className="flex gap-2">
                      <Button onClick={handleApplyFilters} variant="outline" className="flex-1">
                        <Filter className="h-4 w-4 mr-2" />
                        Terapkan Filter
                      </Button>
                      {activeFiltersCount > 0 && (
                        <Button onClick={clearFilters} variant="ghost" size="icon">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button onClick={handleUploadAll} variant="outline" className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Upload Semua
                      </Button>
                    </div>
                  )}

                  {/* Upload Mode Indicator */}
                  {uploadMode === 'filtered' && activeFiltersCount > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Mode:</strong> Upload data yang sudah difilter 
                        ({cleanedData.length} baris)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {cleanedData.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Retailer</th>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-right">Units</th>
                          <th className="p-2 text-right">Sales</th>
                          <th className="p-2 text-left">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cleanedData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{row.Retailer || '-'}</td>
                            <td className="p-2">{row['Invoice Date'] || '-'}</td>
                            <td className="p-2">{row.Product || '-'}</td>
                            <td className="p-2 text-right">{row['Units Sold'] || 0}</td>
                            <td className="p-2 text-right">{row['Total Sales']?.toLocaleString() || 0}</td>
                            <td className="p-2">{row['Sales Method'] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {cleanedData.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      ...dan {cleanedData.length - 10} baris lainnya
                    </p>
                  )}
                </>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleUpload} 
                  disabled={isLoading || isParsing || cleanedData.length === 0}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ke Database
                    </>
                  )}
                </Button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {result.success ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p>{result.message}</p>
        </div>
      )}
    </div>
  )
}
