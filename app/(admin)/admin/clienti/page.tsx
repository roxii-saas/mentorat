import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Mail, Phone, Calendar } from 'lucide-react'

export default async function ClientiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: clients } = await supabase
    .from('profiles')
    .select('*, bookings(id, status, scheduled_at)')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Cliente</h1>
          <p className="text-gray-500 font-sans mt-1">{clients?.length ?? 0} cliente înregistrate</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {!clients?.length ? (
          <div className="text-center py-12 text-gray-400 font-sans">Nu există cliente momentan.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.map(client => {
              const bookings = (client.bookings as any[]) ?? []
              const totalSessions = bookings.length
              const completedSessions = bookings.filter((b: any) => b.status === 'completed').length
              const lastSession = bookings
                .filter((b: any) => b.status !== 'cancelled')
                .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())[0]

              return (
                <div key={client.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-bold text-gray-900 font-serif">{client.full_name || '(fără nume)'}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-sm text-gray-500 font-sans">
                          <Mail className="w-3.5 h-3.5" /> {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1 text-sm text-gray-500 font-sans">
                            <Phone className="w-3.5 h-3.5" /> {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{totalSessions}</p>
                        <p className="text-xs text-gray-400 font-sans">sesiuni</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{completedSessions}</p>
                        <p className="text-xs text-gray-400 font-sans">finalizate</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-xs text-gray-400 font-sans">
                      Înregistrată: {format(new Date(client.created_at), 'd MMM yyyy', { locale: ro })}
                    </span>
                    {client.purchased_at && (
                      <span className="text-xs text-green-600 font-sans font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                        ✓ Plată confirmată
                      </span>
                    )}
                    {lastSession && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-sans">
                        <Calendar className="w-3 h-3" />
                        Ultima sesiune: {format(new Date(lastSession.scheduled_at), 'd MMM yyyy', { locale: ro })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
