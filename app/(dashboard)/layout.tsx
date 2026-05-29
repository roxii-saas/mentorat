import DashboardNav from '@/components/dashboard/DashboardNav'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="dashboard-theme">
      <div className="min-h-screen dashboard-bg transition-colors duration-200">
        <DashboardNav />
        <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
