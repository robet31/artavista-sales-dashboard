'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Edit2, Trash2, MapPin, Building2, AlertCircle } from 'lucide-react'
import { Restaurant } from '@/types'

export default function RestaurantsPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/restaurants')
      if (!res.ok) {
        if (res.status === 403) {
          setError('Anda tidak memiliki akses ke data restoran.')
          return
        }
        if (res.status === 401) {
          setError('Silakan login terlebih dahulu.')
          return
        }
        throw new Error('Gagal mengambil data restoran')
      }
      const data = await res.json()
      setRestaurants(data)
    } catch (err) {
      console.error('Error fetching restaurants:', err)
      setError('Terjadi kesalahan saat mengambil data. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
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
    </div>
  )
}
