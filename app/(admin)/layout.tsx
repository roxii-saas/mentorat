import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <AdminNav />
      <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  )
}
