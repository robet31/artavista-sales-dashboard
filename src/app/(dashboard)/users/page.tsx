'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Shield,
  Store
} from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  code: string
}

interface UserData {
  id: string
  email: string
  name: string
  role: string
  position: string
  isActive: boolean
  createdAt: string
  lastLogin: string | null
  restaurantId: string | null
  restaurant: Restaurant | null
}

interface UserFormData {
  email: string
  name: string
  password: string
  role: string
  position: string
  restaurantId: string
  isActive: boolean
}

const ROLES = [
  { value: 'ADMIN_PUSAT', label: 'Admin Pusat', description: 'Akses penuh ke semua fitur' },
  { value: 'GM', label: 'General Manager', description: 'Manajemen semua restoran' },
  { value: 'MANAGER', label: 'Manager', description: 'Manajemen satu restoran' },
  { value: 'ASMAN', label: 'Asisten Manager', description: 'Bantu manager operasional' },
  { value: 'STAFF', label: 'Staff', description: 'Akses terbatas upload data' }
]

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [users, setUsers] = useState<UserData[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'STAFF',
    position: 'STAFF',
    restaurantId: '',
    isActive: true
  })

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || ''
  const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

  useEffect(() => {
    if (status === 'authenticated') {
      if (!isAdmin) {
        router.push('/')
      } else {
        loadData()
      }
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, isAdmin, router])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, restaurantsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/restaurants')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json()
        setRestaurants(restaurantsData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddDialog = () => {
    setIsEditMode(false)
    setSelectedUser(null)
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'STAFF',
      position: 'STAFF',
      restaurantId: '',
      isActive: true
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: UserData) => {
    setIsEditMode(true)
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      position: user.position,
      restaurantId: user.restaurantId || '',
      isActive: user.isActive
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const url = isEditMode ? `/api/users?id=${selectedUser?.id}` : '/api/users'
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMessage(isEditMode ? 'User berhasil diupdate' : 'User berhasil dibuat')
        setIsDialogOpen(false)
        loadData()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch (err) {
      console.error('Error saving user:', err)
      setError('Terjadi kesalahan saat menyimpan user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccessMessage('User berhasil dihapus')
        loadData()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus user')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Terjadi kesalahan saat menghapus user')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN_PUSAT': return 'bg-red-100 text-red-700 border-red-200'
      case 'GM': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ASMAN': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getRoleLabel = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role)
    return roleObj?.label || role
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Akses Ditolak</h2>
            <p className="text-slate-500 text-center max-w-md">
              Anda tidak memiliki akses ke halaman ini. Hanya GM dan Admin Pusat yang dapat mengelola user.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Manajemen User
          </h1>
          <p className="text-slate-500 mt-1">Kelola user GM, Admin, Manager, dan Staff</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah User
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Cari user berdasarkan nama, email, atau role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-slate-500">Tidak ada user ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.restaurant && (
                          <Badge variant="outline" className="bg-slate-50">
                            <Store className="w-3 h-3 mr-1" />
                            {user.restaurant.name}
                          </Badge>
                        )}
                        <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                          {user.isActive ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Aktif</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Nonaktif</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update informasi user' : 'Isi informasi untuk membuat user baru'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditMode && '(Kosongkan jika tidak ingin mengubah)'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditMode ? '••••••••' : 'Masukkan password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    role: value,
                    position: value
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span>{role.label}</span>
                        <span className="text-xs text-slate-500">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant">Restoran (Opsional)</Label>
              <Select
                value={formData.restaurantId}
                onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih restoran (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name} ({restaurant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Aktif
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-slate-400" />
                      Nonaktif
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                isEditMode ? 'Update User' : 'Buat User'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
