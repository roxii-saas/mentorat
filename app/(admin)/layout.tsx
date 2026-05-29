import AdminNav from '@/components/admin/AdminNav'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="admin-theme">
      <div className="min-h-screen dashboard-bg transition-colors duration-200">
        <AdminNav />
        <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
