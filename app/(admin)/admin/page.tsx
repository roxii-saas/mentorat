import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import AdminCharts from '@/components/admin/AdminCharts'

export default async function AdminOverview() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: pendingBookings },
    { count: confirmedBookings },
    { count: completedBookings },
    { data: upcomingBookings },
    { data: settings },
    { data: allBookings },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('*, profiles(full_name, email)')
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at').limit(5),
    supabase.from('platform_settings').select('price_amount, currency, sales_active').single(),
    supabase.from('bookings').select('scheduled_at, status').order('scheduled_at'),
    supabase.from('profiles').select('created_at').eq('role', 'client')
      .order('created_at', { ascending: false }).limit(6),
  ])

  const revenue = (completedBookings ?? 0) * (settings?.price_amount ?? 297)
  const totalBookings = (pendingBookings ?? 0) + (confirmedBookings ?? 0) + (completedBookings ?? 0)

  // Dati per i grafici (ultimi 6 mesi)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      month: format(d, 'MMM', { locale: ro }),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      bookings: 0,
      clients: 0,
      revenue: 0,
    }
  })

  allBookings?.forEach(b => {
    const d = new Date(b.scheduled_at)
    const idx = months.findIndex(m => m.monthNum === d.getMonth() && m.year === d.getFullYear())
    if (idx >= 0) {
      months[idx].bookings++
      if (b.status === 'completed') months[idx].revenue += settings?.price_amount ?? 297
    }
  })
  recentClients?.forEach(c => {
    const d = new Date(c.created_at)
    const idx = months.findIndex(m => m.monthNum === d.getMonth() && m.year === d.getFullYear())
    if (idx >= 0) months[idx].clients++
  })

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'În așteptare', color: 'bg-amber-400/20 text-amber-300' },
    confirmed: { label: 'Confirmată', color: 'bg-green-400/20 text-green-300' },
    completed: { label: 'Finalizată', color: 'bg-blue-400/20 text-blue-300' },
    cancelled: { label: 'Anulată', color: 'bg-red-400/20 text-red-300' },
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">Bună ziua, Roxana! 👋</h1>
          <p className="text-gray-400 font-sans text-sm mt-0.5">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-bold ${settings?.sales_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${settings?.sales_active ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {settings?.sales_active ? 'Vânzări active' : 'Vânzări oprite'}
          </div>
          <Link href="/admin/setari" className="bg-white/10 hover:bg-white/20 text-white font-sans font-semibold text-xs px-3 py-1.5 rounded-full transition-colors">
            Setări
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Cliente totale', value: totalClients ?? 0, delta: '+' + (recentClients?.length ?? 0) + ' luna aceasta', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', from: 'from-blue-500', to: 'to-indigo-600' },
          { label: 'Rezervări totale', value: totalBookings, delta: `${pendingBookings ?? 0} în așteptare`, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', from: 'from-purple-500', to: 'to-pink-600' },
          { label: 'Sesiuni finalizate', value: completedBookings ?? 0, delta: `${confirmedBookings ?? 0} confirmate`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', from: 'from-green-500', to: 'to-emerald-600' },
          { label: 'Venit total estimat', value: `${revenue.toLocaleString()} ${(settings?.currency ?? 'eur').toUpperCase()}`, delta: `${settings?.price_amount ?? 297} ${settings?.currency?.toUpperCase() ?? 'EUR'}/sesiune`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', from: 'from-[#c97d4e]', to: 'to-[#a85e35]' },
        ].map(card => (
          <div key={card.label} className="bg-gray-900 rounded-2xl p-4 sm:p-5 border border-white/5 shadow-sm hover:border-white/10 transition-colors">
            <div className={`w-10 h-10 bg-gradient-to-br ${card.from} ${card.to} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
                <path d={card.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">{card.value}</p>
            <p className="text-xs sm:text-sm text-gray-400 font-sans mt-0.5 leading-tight">{card.label}</p>
            <p className="text-xs text-gray-600 font-sans mt-1">{card.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <AdminCharts data={months} />

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Upcoming sessions */}
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-serif font-bold text-white">Sesiuni viitoare</h2>
            <Link href="/admin/calendar" className="text-xs font-sans text-[#c97d4e] hover:underline">
              Calendar complet →
            </Link>
          </div>
          {!upcomingBookings?.length ? (
            <div className="text-center py-10 text-gray-600 font-sans text-sm">
              Nicio sesiune programată.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {upcomingBookings.map(b => {
                const s = statusMap[b.status] ?? { label: b.status, color: 'bg-gray-600/20 text-gray-400' }
                return (
                  <div key={b.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-[#c97d4e]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="2" className="w-5 h-5">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white font-sans truncate">
                        {(b.profiles as any)?.full_name || (b.profiles as any)?.email}
                      </p>
                      <p className="text-xs text-gray-500 font-sans">
                        {format(new Date(b.scheduled_at), "EEEE, d MMM 'la' HH:mm", { locale: ro })}
                      </p>
                    </div>
                    <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-serif font-bold text-white px-1">Acțiuni rapide</h2>
          {[
            { href: '/admin/disponibilitate', label: 'Adaugă disponibilitate', desc: 'Setează slot-uri noi', icon: 'M12 5v14M5 12h14', from: 'from-[#c97d4e]', to: 'to-[#a85e35]' },
            { href: '/admin/clienti', label: 'Gestionează cliente', desc: `${totalClients} cliente totale`, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', from: 'from-blue-500', to: 'to-indigo-600' },
            { href: '/admin/setari', label: 'Modifică prețul', desc: `Preț curent: ${settings?.price_amount ?? 297} ${settings?.currency?.toUpperCase() ?? 'EUR'}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1', from: 'from-green-500', to: 'to-emerald-600' },
          ].map(action => (
            <Link key={action.href} href={action.href}
              className="flex items-center gap-3 bg-gray-900 rounded-2xl p-4 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
              <div className={`w-10 h-10 bg-gradient-to-br ${action.from} ${action.to} rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
                  <path d={action.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white font-sans">{action.label}</p>
                <p className="text-xs text-gray-500 font-sans truncate">{action.desc}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
