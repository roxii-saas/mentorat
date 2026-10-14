import Sidebar from '@/components/Sidebar'
import { getProfileName, requireAuth } from '@/lib/auth'

const clientItems = [
  { href:'/dashboard', label:'Acasă', exact:true, icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href:'/dashboard/prenota', label:'Programează sesiune', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href:'/dashboard/profil', label:'Profilul meu', icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const userName = await getProfileName(user.id)

  return (
    <div className="flex h-screen overflow-hidden db-bg">
      <Sidebar items={clientItems} role="client" userName={userName} userEmail={user.email}/>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-[76px] lg:pt-8 px-4 sm:px-6 lg:px-9 pb-10 lg:pb-12">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
