'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Edit2, Trash2, MapPin, Building2, AlertCircle, Eye, X, UserPlus, UserMinus } from 'lucide-react'
import { Restaurant, User } from '@/types'
import { prisma } from '@/lib/db'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RestaurantWithUsers extends Restaurant {
  users?: User[]
}

export default function RestaurantsPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<RestaurantWithUsers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithUsers | null>(null)
  const [restaurantUsers, setRestaurantUsers] = useState<User[]>([])
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('STAFF')
  const [newUserPassword, setNewUserPassword] = useState('')

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/restaurants')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRestaurants(data.restaurants || [])
    } catch (err) {
      console.error('Error fetching retailers:', err)
      setError('Terjadi kesalahan saat mengambil data. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUsers = async (restaurant: RestaurantWithUsers) => {
    setSelectedRestaurant(restaurant)
    try {
      const res = await fetch(`/api/users?restaurantId=${restaurant.id}`)
      if (res.ok) {
        const data = await res.json()
        setRestaurantUsers(data.users || [])
      } else {
        setRestaurantUsers([])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setRestaurantUsers([])
    }
    setIsUserModalOpen(true)
  }

  const handleAddUser = async () => {
    if (!selectedRestaurant || !newUserEmail || !newUserName || !newUserPassword) {
      alert('Mohon lengkapi semua data')
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
          restaurantId: selectedRestaurant.id
        })
      })

      if (res.ok) {
        alert('User berhasil ditambahkan!')
        setNewUserEmail('')
        setNewUserName('')
        setNewUserRole('STAFF')
        setNewUserPassword('')
        handleViewUsers(selectedRestaurant)
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menambahkan user')
      }
    } catch (err) {
      console.error('Error adding user:', err)
      alert('Gagal menambahkan user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        alert('User berhasil dihapus!')
        if (selectedRestaurant) {
          handleViewUsers(selectedRestaurant)
        }
      } else {
        alert('Gagal menghapus user')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Gagal menghapus user')
    }
  }

  const handleDelete = async (restaurantId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus restoran ini?')) {
      return
    }

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Gagal menghapus restoran')
      }

      setRestaurants(restaurants.filter((r) => r.id !== restaurantId))
    } catch (err) {
      console.error('Error deleting restaurant:', err)
      alert('Gagal menghapus restoran. Silakan coba lagi.')
    }
  }

  const handleAdd = () => {
    setEditingRestaurant(null)
    setIsAddModalOpen(true)
  }

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setIsAddModalOpen(true)
  }

  // Check if user has access
  if (userRole && userRole !== 'GM' && userRole !== 'ADMIN_PUSAT') {
    return (
      <div className="p-6">
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-8 text-center">
            <AlertCircle 
              className="mx-auto h-12 w-12 mb-4" 
              style={{ color: 'var(--destructive)' }}
            />
            <p style={{ color: 'var(--muted-foreground)' }}>
              Anda tidak memiliki akses ke halaman ini.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--foreground)' }}
          >
            Manajemen Restoran
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Kelola data restoran Anda
          </p>
        </div>
        <Button 
          onClick={handleAdd} 
          className="w-full sm:w-auto"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)'
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Restoran
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 
            className="h-8 w-8 animate-spin" 
            style={{ color: 'var(--primary)' }}
          />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-8 text-center">
            <AlertCircle 
              className="mx-auto h-12 w-12 mb-4" 
              style={{ color: 'var(--destructive)' }}
            />
            <p style={{ color: 'var(--muted-foreground)' }} className="mb-4">
              {error}
            </p>
            <Button 
              onClick={fetchRestaurants} 
              variant="outline"
              style={{ 
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && restaurants.length === 0 && (
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-8 text-center">
            <Building2 
              className="mx-auto h-12 w-12 mb-4" 
              style={{ color: 'var(--muted-foreground)' }}
            />
            <p style={{ color: 'var(--muted-foreground)' }} className="mb-4">
              Belum ada data restoran.
            </p>
            <Button 
              onClick={handleAdd}
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              Tambah Restoran Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Restaurants Table */}
      {!isLoading && !error && restaurants.length > 0 && (
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--card-foreground)' }}>
              Daftar Restoran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th 
                      className="text-left py-3 px-4 font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Nama Restoran
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Kode
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Lokasi
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Status
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((restaurant) => (
                    <tr
                      key={restaurant.id}
                      className="transition-colors hover:opacity-80"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                            style={{ 
                              backgroundColor: 'var(--accent)'
                            }}
                          >
                            <Building2 
                              className="h-5 w-5" 
                              style={{ color: 'var(--primary)' }}
                            />
                          </div>
                          <span 
                            className="font-medium"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {restaurant.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-foreground)'
                          }}
                        >
                          {restaurant.code}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div 
                          className="flex items-center"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <MapPin 
                            className="h-4 w-4 mr-1" 
                            style={{ color: 'var(--muted-foreground)' }}
                          />
                          <span>
                            {restaurant.location || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: restaurant.isActive 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : 'rgba(239, 68, 68, 0.1)',
                            color: restaurant.isActive 
                              ? 'rgb(34, 197, 94)' 
                              : 'rgb(239, 68, 68)'
                          }}
                        >
                          {restaurant.isActive ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUsers(restaurant)}
                            style={{ color: 'var(--primary)' }}
                            title="Kelola User"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(restaurant)}
                            style={{ color: 'var(--primary)' }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(restaurant.id)}
                            style={{ color: 'var(--destructive)' }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple Modal Placeholder */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <Card 
            className="w-full max-w-md"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <CardHeader>
              <CardTitle style={{ color: 'var(--card-foreground)' }}>
                {editingRestaurant ? 'Edit Restoran' : 'Tambah Restoran Baru'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p style={{ color: 'var(--muted-foreground)' }} className="text-sm">
                Form akan diimplementasikan di sini.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  Batal
                </Button>
                <Button 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ 
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management Modal */}
      {isUserModalOpen && selectedRestaurant && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <Card 
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle style={{ color: 'var(--card-foreground)' }}>
                  Kelola User - {selectedRestaurant.name}
                </CardTitle>
                <p style={{ color: 'var(--muted-foreground)' }} className="text-sm mt-1">
                  Tambah, hapus, atau ubah role user untuk restoran ini
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Add User Form */}
              <div className="p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah User Baru
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input 
                      type="email"
                      placeholder="email@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nama</Label>
                    <Input 
                      placeholder="Nama Lengkap"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Password</Label>
                    <Input 
                      type="password"
                      placeholder="Password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Role</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ASISTEN_MANAGER">Asisten Manager</option>
                      <option value="ADMIN_PUSAT">Admin Pusat</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleAddUser}
                  className="w-full mt-3"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah User
                </Button>
              </div>

              {/* User List */}
              <div>
                <h4 className="font-semibold mb-3">Daftar User ({restaurantUsers.length})</h4>
                {restaurantUsers.length === 0 ? (
                  <p style={{ color: 'var(--muted-foreground)' }} className="text-sm">
                    Belum ada user untuk restoran ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {restaurantUsers.map((user) => (
                      <div 
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p style={{ color: 'var(--muted-foreground)' }} className="text-sm">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: user.role === 'MANAGER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                              color: user.role === 'MANAGER' ? 'rgb(59, 130, 246)' : 'rgb(148, 163, 184)'
                            }}
                          >
                            {user.role}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ color: 'var(--destructive)' }}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
