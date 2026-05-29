import DashboardNav from '@/components/dashboard/DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
