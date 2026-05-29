import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ro } from 'date-fns/locale'

const I = {
  cal:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  chk:  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clk:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  str:  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  vid:  'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  arr:  'M5 12h14M12 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
}

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending:   ['În așteptare', 'db-badge-pending'],
    confirmed: ['Confirmată',   'db-badge-confirmed'],
    completed: ['Finalizată',   'db-badge-completed'],
    cancelled: ['Anulată',      'db-badge-cancelled'],
  }
  const [label, cls] = m[status] ?? [status, 'bg-gray-100 text-gray-500']
  return <span className={`${cls} text-[11px] font-sans font-bold px-2.5 py-1 rounded-full whitespace-nowrap`}>{label}</span>
}

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*').eq('client_id', user.id).order('scheduled_at', { ascending: false }),
  ])

  const upcoming = (bookings ?? [])
    .filter(b => b.status !== 'cancelled' && new Date(b.scheduled_at) > new Date())
    .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))
  const completed = (bookings ?? []).filter(b => b.status === 'completed')
  const nextBooking = upcoming[0]
  const days = profile?.purchased_at ? differenceInDays(new Date(), new Date(profile.purchased_at)) : 0
  const firstName = profile?.full_name?.split(' ')[0] || 'prietenă'
  const progress = Math.min(100, Math.round((completed.length / Math.max((bookings?.length ?? 0), 1)) * 100))
  const circ = 2 * Math.PI * 50

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Bună, {firstName}!</h1>
          <p className="db-muted font-sans text-sm mt-0.5">{days > 0 ? `Membră de ${days} zile` : 'Bine ai venit!'}</p>
        </div>
        <Link href="/dashboard/prenota" className="inline-flex items-center gap-2 bg-[#ED03E9] hover:bg-[#B800BA] text-white font-sans font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-[#ED03E9]/20 active:scale-[.98] transition-all text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4"><path d={I.plus} strokeLinecap="round"/></svg>
          Programează sesiune
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Sesiuni totale', value: bookings?.length ?? 0, d: I.cal, c:'#ED03E9', bg:'rgba(237,3,233,0.08)' },
          { label:'Finalizate',     value: completed.length,       d: I.chk, c:'#10B981', bg:'rgba(16,185,129,0.08)' },
          { label:'Viitoare',       value: upcoming.length,        d: I.clk, c:'#6B00E8', bg:'rgba(107,0,232,0.08)' },
          { label:'Zile membră',    value: days,                   d: I.str, c:'#F59E0B', bg:'rgba(245,158,11,0.08)' },
        ].map(card => (
          <div key={card.label} className="db-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background:card.bg }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px]" style={{ stroke:card.c }}>
                <path d={card.d} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold db-text">{card.value}</p>
            <p className="text-xs db-muted font-sans mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Next session */}
        <div className="lg:col-span-2">
          {nextBooking ? (
            <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ background:'linear-gradient(135deg,#ED03E9,#6B00E8)' }}>
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-bl-full pointer-events-none"/>
              <div className="relative p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"/>
                    <span className="relative rounded-full h-2 w-2 bg-white inline-flex"/>
                  </span>
                  <span className="text-white/70 text-xs font-sans font-semibold uppercase tracking-wider">Următoarea sesiune</span>
                </div>
                <p className="text-white font-serif font-bold text-xl sm:text-2xl capitalize mb-1">
                  {format(new Date(nextBooking.scheduled_at), "EEEE, d MMMM", { locale: ro })}
                </p>
                <p className="text-white/70 font-sans mb-5">{format(new Date(nextBooking.scheduled_at), "HH:mm")} · {nextBooking.duration_minutes ?? 60} min</p>
                {nextBooking.meet_link
                  ? <a href={nextBooking.meet_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-[#ED03E9] font-sans font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 active:scale-[.98] transition-all shadow-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d={I.vid} strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Intră în sesiune
                    </a>
                  : <span className="text-white/50 text-sm font-sans bg-black/15 px-4 py-2 rounded-xl">Link-ul va fi trimis de Roxana</span>
                }
              </div>
            </div>
          ) : (
            <div className="db-card rounded-2xl border-2 border-dashed border-[#ED03E9]/20 p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[180px]">
              <div className="w-12 h-12 bg-[#ED03E9]/8 rounded-2xl flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-6 h-6"><path d={I.cal} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="font-serif font-bold db-text mb-1">Nicio sesiune programată</p>
              <p className="db-muted text-sm font-sans mb-4">Rezervă primul tău slot cu Roxana!</p>
              <Link href="/dashboard/prenota" className="inline-flex items-center gap-2 bg-[#ED03E9] text-white font-sans font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#B800BA] active:scale-[.98] transition-all shadow-md shadow-[#ED03E9]/20">
                Programează acum
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4"><path d={I.arr} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="db-card rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="font-serif font-semibold db-text mb-3">Progresul tău</h3>
          <div className="flex items-center justify-center flex-1 my-1">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F0F0F2" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" strokeLinecap="round"
                  stroke="url(#pg)" strokeDasharray={`${(progress/100)*circ} ${circ}`}
                  style={{ transition:'stroke-dasharray 1s ease' }}/>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ED03E9"/><stop offset="100%" stopColor="#6B00E8"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-serif font-bold db-text">{progress}%</span>
                <span className="text-[10px] db-muted font-sans">completat</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {[{ l:'Finalizate', v:completed.length, c:'#10B981' }, { l:'Viitoare', v:upcoming.length, c:'#ED03E9' }].map(item => (
              <div key={item.l} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:item.c }}/>
                <span className="text-xs db-muted font-sans flex-1">{item.l}</span>
                <span className="text-xs font-bold db-text font-sans">{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storico */}
      {(bookings?.length ?? 0) > 0 && (
        <div className="db-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-black/[.05] flex items-center justify-between">
            <h2 className="font-serif font-semibold db-text">Istoricul sesiunilor</h2>
            <span className="text-[11px] db-muted font-sans">{bookings?.length} total</span>
          </div>
          <div className="divide-y divide-black/[.04]">
            {bookings?.slice(0, 6).map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-black/[.02] transition-colors">
                <div className="w-8 h-8 bg-[#ED03E9]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="2" className="w-4 h-4"><path d={I.cal} strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold db-text font-sans">{format(new Date(b.scheduled_at), "d MMM yyyy", { locale: ro })}</p>
                  <p className="text-xs db-muted font-sans">{format(new Date(b.scheduled_at), "HH:mm")} · {b.duration_minutes ?? 60} min</p>
                </div>
                {b.meet_link && b.status === 'confirmed' && (
                  <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#ED03E9] hover:underline hidden sm:block font-sans">Intră →</a>
                )}
                <Badge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
