'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  User,
  Users,
  Mail,
  Briefcase
} from 'lucide-react'

interface Staff {
  id: string
  name: string
  email: string
  position: string
  isActive: boolean
  createdAt: string
}

interface Restaurant {
  id: string
  name: string
  code: string
}

export default function StaffPage() {
  const { data: session } = useSession()
  const [staff, setStaff] = useState<Staff[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: 'STAFF'
  })

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const userRestaurantId = (session?.user as any)?.restaurantId
  const isManager = userRole === 'MANAGER' || userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [staffRes, restaurantsRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/upload')
      ])

      const staffData = await staffRes.json()
      const restaurantsData = await restaurantsRes.json()

      setStaff(staffData)
      setRestaurants(restaurantsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStaff = staff
    .filter(s => s.position !== 'MANAGER') // Jangan tampilkan manager di UI
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const openAddDialog = () => {
    setIsEditMode(false)
    setCurrentStaff(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      position: 'STAFF'
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (staffMember: Staff) => {
    setIsEditMode(true)
    setCurrentStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: '',
      position: staffMember.position
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('Nama dan email wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const method = isEditMode ? 'PUT' : 'POST'
      const url = isEditMode ? `/api/staff?id=${currentStaff?.id}` : '/api/staff'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurantId: userRestaurantId
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
    if (!confirm('Yakin hapus staff ini?')) return

    try {
      const res = await fetch(`/api/staff?id=${id}`, {
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

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/staff?id=${id}&toggle=true`, {
        method: 'PUT'
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kelola Staff
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola data staff restoran Anda
          </p>
        </div>
        {isManager && (
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Staff
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div className="text-sm text-slate-500">
              Total: {filteredStaff.length} staff
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posisi</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dibuat</th>
                    {isManager && <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={isManager ? 6 : 5} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p>Tidak ada data staff</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{s.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            s.position === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
                            s.position === 'ASISTEN_MANAGER' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {s.position === 'MANAGER' ? 'Manager' : s.position === 'ASISTEN_MANAGER' ? 'Manajemen' : 'Staff'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(s.id, s.isActive)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              s.isActive 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {s.isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {new Date(s.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        {isManager && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(s)}
                                className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(s.id)}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
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
        <DialogContent className="max-w-md p-0 overflow-hidden" onClose={() => setIsDialogOpen(false)}>
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                {isEditMode ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {isEditMode ? 'Edit Staff' : 'Tambah Staff Baru'}
                </DialogTitle>
                <DialogDescription className="text-sm text-white/80">
                  {isEditMode ? 'Perbarui informasi staff restoran' : 'Tambah data staff baru ke restoran'}
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Masukkan nama lengkap"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@restoran.com"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white transition-colors"
                />
                <p className="text-xs text-slate-400">Minimal 6 karakter</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Posisi</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                <Select value={formData.position} onValueChange={(v) => setFormData({...formData, position: v})}>
                  <SelectTrigger className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white transition-colors">
                    <SelectValue placeholder="Pilih posisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Staff
                      </div>
                    </SelectItem>
                    {userRole === 'MANAGER' && (
                      <SelectItem value="ASISTEN_MANAGER">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Manajemen
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="px-6 h-11 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  {isEditMode ? 'Perbarui' : 'Tambah Staff'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
