'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Building2, 
  Users, 
  Settings as SettingsIcon,
  Loader2,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  code: string
  location: string
  description: string
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  restaurantId: string | null
  restaurant?: Restaurant
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [activeTab, setActiveTab] = useState('restaurants')
  const [isLoading, setIsLoading] = useState(true)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [restaurantsRes, usersRes] = await Promise.all([
        fetch('/api/restaurants'),
        fetch('/api/users')
      ])

      if (restaurantsRes.ok) {
        const data = await restaurantsRes.json()
        setRestaurants(data)
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (userRole !== 'GM') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <SettingsIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              Anda tidak memiliki akses ke halaman Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Kelola restoran dan pengguna</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'restaurants' ? 'default' : 'outline'}
          onClick={() => setActiveTab('restaurants')}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Restoran
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
      </div>

      {activeTab === 'restaurants' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kelola Restoran</CardTitle>
                <CardDescription>Daftar restoran yang terdaftar dalam sistem</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Restoran
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{restaurant.name}</p>
                    <p className="text-sm text-gray-500">
                      {restaurant.code} - {restaurant.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kelola Pengguna</CardTitle>
                <CardDescription>Daftar pengguna sistem dan role akses</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.email} - {user.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
