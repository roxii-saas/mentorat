import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import ResendEmailBtn from '@/components/admin/ResendEmailBtn'

export default async function ClientiPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })

  const total = purchases?.length ?? 0
  const withPhone = purchases?.filter(p => p.phone)?.length ?? 0
  const thisMonth = purchases?.filter(p => {
    const d = new Date(p.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length ?? 0

  return (
    <div className="space-y-4 sm:space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Clienți</h1>
          <p className="db-muted font-sans text-sm mt-0.5">{total} rezervări înregistrate</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total rezervări', value: total, color: '#ED03E9', bg: 'rgba(237,3,233,0.08)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { label: 'Luna aceasta', value: thisMonth, color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Cu telefon', value: withPhone, color: '#6B00E8', bg: 'rgba(107,0,232,0.08)', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
        ].map(s => (
          <div key={s.label} className="g-card rounded-2xl p-4 sm:p-5 text-center">
            <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: s.bg }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px]" style={{ stroke: s.color }}>
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
                {['Clientă', 'Email', 'Telefon', 'Sumă', 'Data', 'Acțiuni'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold db-muted font-sans uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.04]">
              {purchases?.map(p => (
                <tr key={p.id} className="hover:bg-black/[.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#ED03E9] to-[#B800BA] rounded-full flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0 shadow-md">
                        {(p.name || p.email || '?')[0].toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold db-text font-sans">{p.name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm db-muted font-sans">{p.email}</td>
                  <td className="px-5 py-3.5 text-sm font-sans">
                    {p.phone
                      ? <a href={`tel:${p.phone}`} className="db-text hover:text-[#ED03E9] transition-colors flex items-center gap-1.5">
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 db-muted flex-shrink-0">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {p.phone}
                        </a>
                      : <span className="db-muted">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold font-sans" style={{ color:'#ED03E9' }}>
                      {p.amount} {(p.currency ?? 'eur').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm db-muted font-sans">
                    {format(new Date(p.created_at), 'd MMM yyyy, HH:mm', { locale: ro })}
                  </td>
                  <td className="px-5 py-3.5">
                    <ResendEmailBtn purchaseId={p.id} email={p.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-black/[.04]">
          {purchases?.map(p => (
            <div key={p.id} className="px-4 py-4 flex items-start gap-3 hover:bg-black/[.02] transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ED03E9] to-[#B800BA] rounded-full flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0 shadow-md">
                {(p.name || p.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold db-text font-sans truncate">{p.name || '—'}</p>
                  <span className="text-xs font-bold font-sans flex-shrink-0" style={{ color:'#ED03E9' }}>
                    {p.amount} {(p.currency ?? 'eur').toUpperCase()}
                  </span>
                </div>
                <p className="text-xs db-muted font-sans truncate mt-0.5">{p.email}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="text-xs db-muted font-sans flex items-center gap-1 hover:text-[#ED03E9] transition-colors">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {p.phone}
                    </a>
                  )}
                  <span className="text-xs db-muted font-sans">{format(new Date(p.created_at), 'd MMM yyyy', { locale: ro })}</span>
                  <ResendEmailBtn purchaseId={p.id} email={p.email} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {!purchases?.length && (
          <div className="text-center py-12 db-muted font-sans text-sm">Nicio rezervare înregistrată încă.</div>
        )}
      </div>
    </div>
  )
}
