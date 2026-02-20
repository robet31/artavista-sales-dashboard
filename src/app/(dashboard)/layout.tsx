import { Sidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="w-64 shrink-0 h-screen sticky top-0">
        <Sidebar className="h-full" />
      </div>
      <main className="flex-1 overflow-auto h-screen">
        {children}
      </main>
    </div>
  )
}
