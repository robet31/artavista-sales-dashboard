'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Sparkles
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const allNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['GM', 'ADMIN_PUSAT', 'MANAGER', 'ASMAN', 'ASISTEN_MANAGER', 'STAFF'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['GM', 'ADMIN_PUSAT', 'MANAGER'] },
  { name: 'Upload Data', href: '/upload', icon: Upload, roles: ['GM', 'ADMIN_PUSAT', 'MANAGER', 'ASMAN', 'ASISTEN_MANAGER', 'STAFF'] },
  { name: 'Data Order', href: '/orders', icon: ShoppingCart, roles: ['GM', 'ADMIN_PUSAT', 'MANAGER', 'ASMAN', 'ASISTEN_MANAGER', 'STAFF'] },
  { name: 'Forecasting', href: '/forecasting', icon: TrendingUp, roles: ['GM', 'ADMIN_PUSAT'] },
  { name: 'Rekomendasi', href: '/recommendation', icon: Sparkles, roles: ['GM', 'ADMIN_PUSAT'] },
]

const managerNavigation = [
  { name: 'Kelola Staff', href: '/staff', icon: Users, roles: ['MANAGER', 'ASMAN', 'ASISTEN_MANAGER'] },
]

const adminNavigation = [
  { name: 'Restoran', href: '/restaurants', icon: Store, roles: ['GM', 'ADMIN_PUSAT'] },
  { name: 'Manajemen User', href: '/users', icon: Users, roles: ['GM', 'ADMIN_PUSAT'] },
]

function getRoleLabel(role: string | undefined) {
  switch (role) {
    case 'MANAGER': return 'Manager'
    case 'ASMAN': return 'Asst. Manager'
    case 'ASISTEN_MANAGER': return 'Asst. Manager'
    case 'ASST_MANAGER': return 'Asst. Manager'
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
  const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isGM = userRole === 'GM'
  const isManager = userRole === 'MANAGER' || userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER'
  const isStaff = userRole === 'STAFF'

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const filteredNavigation = allNavigation.filter(item => item.roles.includes(userRole))
  const filteredAdminNav = adminNavigation.filter(item => item.roles.includes(userRole))
  const filteredManagerNav = managerNavigation.filter(item => item.roles.includes(userRole))

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
          src="/sunest-logo.png" 
          alt="Sunest Systems" 
          className="w-10 h-10 rounded-lg object-contain"
        />
        <div>
          <h1
            className="font-bold text-lg"
            style={{ color: 'var(--sidebar-foreground)' }}
          >
            Sunest Systems
          </h1>
          <p
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Delivery Monitoring
          </p>
        </div>
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

        {(isAdmin || isManager) && (
          <>
            <div className="pt-6 pb-2">
              <p
                className="px-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {(isManager && userRole === 'MANAGER') ? 'Manajemen' : (isManager && (userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER')) ? 'Manajemen' : 'Administration'}
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
            {isAdmin && filteredAdminNav.map((item) => {
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
          <Button
            variant="ghost"
            size="icon"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Bell className="h-5 w-5" />
          </Button>
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
