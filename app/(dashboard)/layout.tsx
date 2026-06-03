import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const clientItems = [
  { href:'/dashboard', label:'Acasă', exact:true, icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href:'/dashboard/prenota', label:'Programează sesiune', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href:'/dashboard/profil', label:'Profilul meu', icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  return (
    <div className="flex h-screen overflow-hidden db-bg relative">
      <div className="fixed top-[-100px] right-[-80px] w-[450px] h-[450px] rounded-full bg-[#ED03E9]/12 blur-[120px] pointer-events-none animate-blob" style={{ zIndex:0 }} />
      <div className="fixed bottom-[-60px] left-[-60px] w-[350px] h-[350px] rounded-full bg-[#6B00E8]/10 blur-[100px] pointer-events-none animate-blob" style={{ animationDelay:'5s', zIndex:0 }} />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar items={clientItems} role="client" userName={profile?.full_name ?? undefined} userEmail={user.email}/>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="max-w-5xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
