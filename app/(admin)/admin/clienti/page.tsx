import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

export default async function ClientiPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('profiles')
    .select('*, bookings(id, status, scheduled_at)')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const total = clients?.length ?? 0
  const withBookings = clients?.filter(c => (c.bookings as any[]).length > 0).length ?? 0
  const recent = clients?.filter(c => {
    const d = new Date(c.created_at)
    const now = new Date()
    return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000
  }).length ?? 0

  return (
    <div className="space-y-4 sm:space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">Cliente</h1>
          <p className="text-gray-400 font-sans text-sm mt-0.5">{total} cliente înregistrate</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Totale', value: total, color: 'from-blue-500 to-indigo-600' },
          { label: 'Cu sesiuni', value: withBookings, color: 'from-green-500 to-emerald-600' },
          { label: 'Noi luna aceasta', value: recent, color: 'from-[#c97d4e] to-[#a85e35]' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-2xl p-4 border border-white/5 text-center">
            <p className={`text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            <p className="text-gray-500 font-sans text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-serif font-semibold text-white">Lista completă</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Clientă', 'Email', 'Sesiuni', 'Înregistrată', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 font-sans uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clients?.map(client => {
                const bookings = (client.bookings as any[]) ?? []
                const completed = bookings.filter((b: any) => b.status === 'completed').length
                const hasPaid = !!client.purchased_at
                return (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-full flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0 shadow-md">
                          {(client.full_name || client.email || '?')[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-white font-sans">{client.full_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 font-sans">{client.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-sans">{bookings.length}</span>
                        {completed > 0 && <span className="text-xs text-gray-500 font-sans">({completed} fin.)</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 font-sans">
                      {format(new Date(client.created_at), 'd MMM yyyy', { locale: ro })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full ${hasPaid ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {hasPaid ? '✓ Plătit' : 'Fără plată'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-white/5">
          {clients?.map(client => {
            const bookings = (client.bookings as any[]) ?? []
            const hasPaid = !!client.purchased_at
            return (
              <div key={client.id} className="px-4 py-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-full flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0">
                  {(client.full_name || client.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white font-sans truncate">{client.full_name || '—'}</p>
                    <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${hasPaid ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {hasPaid ? '✓' : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-sans truncate mt-0.5">{client.email}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-600 font-sans">{bookings.length} sesiuni</span>
                    <span className="text-xs text-gray-600 font-sans">{format(new Date(client.created_at), 'd MMM yyyy', { locale: ro })}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!clients?.length && (
          <div className="text-center py-12 text-gray-600 font-sans text-sm">Nicio clientă înregistrată încă.</div>
        )}
      </div>
    </div>
  )
}
