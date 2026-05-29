import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ro } from 'date-fns/locale'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: bookings } = await supabase
    .from('bookings').select('*').eq('client_id', user.id)
    .order('scheduled_at', { ascending: false })

  const upcoming = bookings?.filter(b => b.status !== 'cancelled' && new Date(b.scheduled_at) > new Date()) ?? []
  const completed = bookings?.filter(b => b.status === 'completed') ?? []
  const nextBooking = upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
  const daysAsMember = profile?.purchased_at ? differenceInDays(new Date(), new Date(profile.purchased_at)) : 0
  const firstName = profile?.full_name?.split(' ')[0] || 'prietenă'

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'În așteptare', color: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Confirmată', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Finalizată', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Anulată', color: 'bg-red-100 text-red-600' },
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
            Bună, {firstName}! 👋
          </h1>
          <p className="text-gray-500 font-sans text-sm mt-0.5">
            {daysAsMember > 0 ? `Ești membră de ${daysAsMember} zile` : 'Bine ai venit în platformă'}
          </p>
        </div>
        <Link href="/dashboard/prenota"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Programează sesiune
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Sesiuni rezervate', value: bookings?.length ?? 0, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
          { label: 'Sesiuni finalizate', value: completed.length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
          { label: 'Sesiuni viitoare', value: upcoming.length, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50' },
          { label: 'Zile ca membră', value: daysAsMember, icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', color: 'from-[#c97d4e] to-[#a85e35]', bg: 'bg-orange-50' },
        ].map(card => (
          <div key={card.label} className="admin-card rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="none" className="w-5 h-5">
                <path d={card.icon} fill={`url(#g${card.label.replace(/\s/g, '')})`} />
                <defs>
                  <linearGradient id={`g${card.label.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c97d4e"/>
                    <stop offset="100%" stopColor="#a85e35"/>
                  </linearGradient>
                </defs>
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="1.8" className="w-5 h-5 -ml-5">
                <path d={card.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">{card.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 font-sans mt-0.5 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Prossima sessione */}
        <div className="lg:col-span-2">
          {nextBooking ? (
            <div className="relative bg-gradient-to-br from-[#c97d4e] to-[#7a3d1e] rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-xl h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-tr-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  <span className="font-sans font-semibold text-white/80 text-sm">Următoarea sesiune</span>
                </div>
                <p className="font-serif font-bold text-2xl sm:text-3xl leading-tight mb-1">
                  {format(new Date(nextBooking.scheduled_at), "EEEE, d MMMM", { locale: ro })}
                </p>
                <p className="text-white/80 font-sans text-lg mb-5">
                  {format(new Date(nextBooking.scheduled_at), "HH:mm")} · {nextBooking.duration_minutes ?? 60} minute
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {nextBooking.meet_link ? (
                    <a href={nextBooking.meet_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-white text-[#c97d4e] font-sans font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Intră în sesiune
                    </a>
                  ) : (
                    <p className="text-white/60 text-sm font-sans bg-black/20 px-4 py-2.5 rounded-xl">
                      🔗 Link-ul va fi trimis de Roxana în curând
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card rounded-2xl border-2 border-dashed border-gray-200 p-6 sm:p-8 text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#c97d4e]/10 rounded-2xl flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="1.8" className="w-8 h-8">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 mb-2">Nicio sesiune programată</h3>
              <p className="text-gray-500 font-sans text-sm mb-5">Programează-ți acum prima sesiune cu Roxana!</p>
              <Link href="/dashboard/prenota"
                className="inline-flex items-center gap-2 bg-[#c97d4e] text-white font-sans font-semibold px-6 py-2.5 rounded-xl hover:bg-[#a85e35] transition-colors text-sm">
                Programează acum
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Progress circle */}
        <div className="admin-card rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif font-semibold text-gray-800 mb-4">Progresul tău</h3>
          <div className="flex items-center justify-center my-2">
            <ProgressCircle completed={completed.length} total={Math.max(completed.length + upcoming.length, 1)} />
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Sesiuni finalizate', value: completed.length, color: 'bg-green-500' },
              { label: 'Sesiuni viitoare', value: upcoming.length, color: 'bg-[#c97d4e]' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs font-sans text-gray-600 flex-1">{item.label}</span>
                <span className="text-xs font-bold text-gray-800 font-sans">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storico sessioni */}
      {bookings && bookings.length > 0 && (
        <div className="admin-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-bold text-base sm:text-lg text-gray-900">Istoricul sesiunilor</h2>
            <span className="text-xs font-sans text-gray-400">{bookings.length} sesiuni</span>
          </div>
          <div className="divide-y divide-gray-50">
            {bookings.slice(0, 6).map(b => {
              const s = statusMap[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={b.id} className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-[#c97d4e]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="2" className="w-5 h-5">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 font-sans">
                      {format(new Date(b.scheduled_at), "d MMM yyyy", { locale: ro })}
                    </p>
                    <p className="text-xs text-gray-500 font-sans">
                      {format(new Date(b.scheduled_at), "HH:mm")} · {b.duration_minutes ?? 60} min
                    </p>
                  </div>
                  {b.meet_link && b.status === 'confirmed' && (
                    <a href={b.meet_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-sans font-semibold text-[#c97d4e] hover:underline hidden sm:block">
                      Intră →
                    </a>
                  )}
                  <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressCircle({ completed, total }: { completed: number; total: number }) {
  const pct = Math.round((completed / total) * 100)
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#progGrad)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 1s ease' }}/>
        <defs>
          <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c97d4e"/>
            <stop offset="100%" stopColor="#a85e35"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-serif font-bold text-gray-900">{pct}%</span>
        <span className="text-xs font-sans text-gray-500">completat</span>
      </div>
    </div>
  )
}
