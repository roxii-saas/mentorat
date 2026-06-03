import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import ResendEmailBtn from '@/components/admin/ResendEmailBtn'

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
    return (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000
  }).length ?? 0

  return (
    <div className="space-y-4 sm:space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Cliente</h1>
          <p className="db-muted font-sans text-sm mt-0.5">{total} cliente înregistrate</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Totale', value: total, color: '#6B00E8', bg: 'rgba(107,0,232,0.08)', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Cu sesiuni', value: withBookings, color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Noi luna aceasta', value: recent, color: '#ED03E9', bg: 'rgba(237,3,233,0.08)', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
        ].map(s => (
          <div key={s.label} className="g-card rounded-2xl p-4 sm:p-5 text-center">
            <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: s.bg }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4.5 h-4.5" style={{ stroke: s.color }}>
                <path d={s.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="db-muted font-sans text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="g-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[.05] flex items-center justify-between">
          <h2 className="font-serif font-semibold db-text">Lista completă</h2>
          <span className="text-xs font-sans db-muted">{total} înregistrate</span>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[.04]">
                {['Clientă', 'Email', 'Telefon', 'Sesiuni', 'Înregistrată', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold db-muted font-sans uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.04]">
              {clients?.map(client => {
                const bookings = (client.bookings as any[]) ?? []
                const completed = bookings.filter((b: any) => b.status === 'completed').length
                const hasPaid = !!client.purchased_at
                return (
                  <tr key={client.id} className="hover:bg-black/[.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#ED03E9] to-[#B800BA] rounded-full flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0 shadow-md">
                          {(client.full_name || client.email || '?')[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold db-text font-sans">{client.full_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm db-muted font-sans">{client.email}</td>
                    <td className="px-5 py-3.5 text-sm font-sans">
                      {client.phone
                        ? <a href={`tel:${client.phone}`} className="db-text hover:text-[#ED03E9] transition-colors flex items-center gap-1.5">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 flex-shrink-0 db-muted">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {client.phone}
                          </a>
                        : <span className="db-muted">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold db-text font-sans">{bookings.length}</span>
                        {completed > 0 && <span className="text-xs db-muted font-sans">({completed} fin.)</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm db-muted font-sans">
                      {format(new Date(client.created_at), 'd MMM yyyy', { locale: ro })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {hasPaid
                          ? <span className="g-badge g-badge-confirmed text-[11px] font-bold font-sans px-2.5 py-1 rounded-full">✓ Plătit</span>
                          : <span className="text-xs font-sans font-semibold px-2.5 py-1 rounded-full bg-black/5 db-muted">Fără plată</span>
                        }
                        <ResendEmailBtn userId={client.id} email={client.email} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-black/[.04]">
          {clients?.map(client => {
            const bookings = (client.bookings as any[]) ?? []
            const hasPaid = !!client.purchased_at
            return (
              <div key={client.id} className="px-4 py-4 flex items-start gap-3 hover:bg-black/[.02] transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ED03E9] to-[#B800BA] rounded-full flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0 shadow-md">
                  {(client.full_name || client.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold db-text font-sans truncate">{client.full_name || '—'}</p>
                    {hasPaid
                      ? <span className="g-badge g-badge-confirmed text-[10px] font-bold font-sans px-2 py-0.5 rounded-full flex-shrink-0">✓</span>
                      : <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-black/5 db-muted">—</span>
                    }
                  </div>
                  <p className="text-xs db-muted font-sans truncate mt-0.5">{client.email}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="text-xs db-muted font-sans flex items-center gap-1 hover:text-[#ED03E9] transition-colors">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {client.phone}
                      </a>
                    )}
                    <span className="text-xs db-muted font-sans">{bookings.length} sesiuni</span>
                    <span className="text-xs db-muted font-sans">{format(new Date(client.created_at), 'd MMM yyyy', { locale: ro })}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!clients?.length && (
          <div className="text-center py-12 db-muted font-sans text-sm">Nicio clientă înregistrată încă.</div>
        )}
      </div>
    </div>
  )
}
