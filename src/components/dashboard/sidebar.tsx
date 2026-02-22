'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  Upload,
  ShoppingCart,
  LogOut,
  Store,
  Bell,
  Users,
  BarChart3,
  TrendingUp,
  Sparkles,
  X,
  Check
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  date: string
}

const allNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['GM', 'MANAGER', 'STAFF'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['GM', 'MANAGER'] },
  { name: 'Upload Data', href: '/upload', icon: Upload, roles: ['GM', 'MANAGER', 'STAFF'] },
  { name: 'Data Transaksi', href: '/orders', icon: ShoppingCart, roles: ['GM', 'MANAGER'] },
  { name: 'Forecasting', href: '/forecasting', icon: TrendingUp, roles: ['GM', 'MANAGER'] },
  { name: 'Rekomendasi', href: '/recommendation', icon: Sparkles, roles: ['GM'] },
]

const managerNavigation = [
  { name: 'Kelola Staff', href: '/staff', icon: Users, roles: ['MANAGER'] },
]

const adminNavigation = [
  { name: 'Retailer', href: '/restaurants', icon: Store, roles: ['GM'] },
]

function getRoleLabel(role: string | undefined) {
  switch (role) {
    case 'GM': return 'GM'
    case 'GENERAL_MANAGER': return 'GM'
    case 'MANAGER': return 'Manager'
    case 'REGIONAL_MANAGER': return 'Manager'
    case 'STAFF': return 'Staff'
    default: return 'Staff'
  }
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()

  const userRole = (session?.user as any)?.role || (session?.user as any)?.position || 'STAFF'
  const isGM = userRole === 'GM' || userRole === 'GENERAL_MANAGER'
  const isManager = userRole === 'MANAGER' || userRole === 'REGIONAL_MANAGER'
  const isStaff = userRole === 'STAFF'

  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Data Baru', message: 'Data penjualan Adidas bulan terbaru sudah tersedia', type: 'info', read: false, date: '2 jam lalu' },
    { id: 2, title: 'Forecast Selesai', message: 'Hasil prediksi penjualan sudah siap dilihat', type: 'success', read: false, date: '5 jam lalu' },
    { id: 3, title: 'Reminder', message: 'Jangan lupa upload data terbaru setiap minggu', type: 'warning', read: true, date: '1 hari lalu' },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const filteredNavigation = allNavigation.filter(item => item.roles.includes(userRole))
  const filteredAdminNav = adminNavigation.filter(item => item.roles.includes(userRole))
  const filteredManagerNav = managerNavigation.filter(item => item.roles.includes(userRole))

  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        className
      )}
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)'
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <img
          src="/Logo Artavista.png"
          alt="Artavista"
          className="w-48 h-auto rounded-lg object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              )}
              style={{
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)'
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {(isGM || isManager) && (
          <>
            <div className="pt-6 pb-2">
              <p
                className="px-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {isGM ? 'Administration' : 'Manajemen'}
              </p>
            </div>
            {isManager && filteredManagerNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)'
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            {isGM && filteredAdminNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)'
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback
              className="rounded-full"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {session?.user?.name ? getInitials(session.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--sidebar-foreground)' }}
            >
              {session?.user?.name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {session?.user?.email}
            </p>
            <p
              className="text-xs font-medium truncate mt-1 px-2 py-0.5 rounded-full inline-block"
              style={{
                color: 'var(--primary-foreground)',
                backgroundColor: 'var(--primary)'
              }}
            >
              {getRoleLabel((session?.user as any)?.position || (session?.user as any)?.role)}
            </p>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div ref={notificationRef} className="absolute -right-8 bottom-12 w-64 max-h-80 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
                <div className="p-2 border-b bg-slate-50 flex items-center justify-between sticky top-0">
                  <h3 className="font-semibold text-sm text-slate-800">Notifikasi</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-56">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-slate-500 text-sm">Tidak ada notifikasi</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b hover:bg-blue-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          markAsRead(notif.id)
                          setShowNotifications(false)
                          if (notif.title.includes('Forecast')) {
                            router.push('/forecasting')
                          } else if (notif.title.includes('Data') || notif.title.includes('upload')) {
                            router.push('/upload')
                          } else if (notif.title.includes('Rekomendasi')) {
                            router.push('/recommendation')
                          } else {
                            router.push('/')
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${notif.type === 'info' ? 'bg-blue-500' :
                              notif.type === 'success' ? 'bg-green-500' :
                                notif.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-slate-800 truncate">{notif.title}</p>
                            <p className="text-xs text-slate-600 truncate">{notif.message}</p>
                            <p className="text-xs text-slate-400">{notif.date}</p>
                          </div>
                          {!notif.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.some(n => !n.read) && (
                  <div className="p-2 border-t bg-slate-50">
                    <button
                      onClick={markAllAsRead}
                      className="w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Tandai semua dibaca
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          style={{
            borderColor: 'var(--sidebar-border)',
            color: 'var(--sidebar-foreground)'
          }}
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  )
}
