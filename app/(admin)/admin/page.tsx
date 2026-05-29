import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import AdminCharts from '@/components/admin/AdminCharts'

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

export default async function AdminOverview() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: pendingBookings },
    { count: completedBookings },
    { data: upcomingBookings },
    { data: settings },
    { data: allBookings },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role','client'),
    supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','completed'),
    supabase.from('bookings').select('*, profiles(full_name, email)').in('status',['pending','confirmed']).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(6),
    supabase.from('platform_settings').select('price_amount, currency, sales_active').single(),
    supabase.from('bookings').select('scheduled_at, status').order('scheduled_at'),
    supabase.from('profiles').select('created_at').eq('role','client').order('created_at', { ascending:false }).limit(20),
  ])

  const revenue = (completedBookings ?? 0) * (settings?.price_amount ?? 297)
  const months = Array.from({ length:6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    return { month: format(d, 'MMM', { locale: ro }), year: d.getFullYear(), m: d.getMonth(), bookings:0, clients:0, revenue:0 }
  })
  allBookings?.forEach(b => {
    const d = new Date(b.scheduled_at)
    const idx = months.findIndex(x => x.m === d.getMonth() && x.year === d.getFullYear())
    if (idx >= 0) { months[idx].bookings++; if (b.status==='completed') months[idx].revenue += settings?.price_amount ?? 297 }
  })
  recentClients?.forEach(c => {
    const d = new Date(c.created_at)
    const idx = months.findIndex(x => x.m === d.getMonth() && x.year === d.getFullYear())
    if (idx >= 0) months[idx].clients++
  })

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Bună ziua, Roxana!</h1>
          <p className="db-muted font-sans text-sm mt-0.5 capitalize">{format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-bold ${settings?.sales_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${settings?.sales_active ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}/>
            {settings?.sales_active ? 'Vânzări active' : 'Vânzări oprite'}
          </div>
          <Link href="/admin/setari" className="text-xs font-sans font-semibold text-[#3D3D3D] px-3 py-1.5 rounded-full border border-black/10 hover:bg-black/5 transition-colors">Setări</Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Cliente totale',   value: totalClients ?? 0,                       d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', c:'#ED03E9', bg:'rgba(237,3,233,0.08)' },
          { label:'În așteptare',     value: pendingBookings ?? 0,                    d:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', c:'#F59E0B', bg:'rgba(245,158,11,0.08)' },
          { label:'Sesiuni finalizate', value: completedBookings ?? 0,               d:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', c:'#10B981', bg:'rgba(16,185,129,0.08)' },
          { label:'Venit estimat',    value:`${revenue.toLocaleString()} ${(settings?.currency??'eur').toUpperCase()}`, d:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1', c:'#6B00E8', bg:'rgba(107,0,232,0.08)' },
        ].map(card => (
          <div key={card.label} className="db-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background:card.bg }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px]" style={{ stroke:card.c }}>
                <path d={card.d} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-serif font-bold db-text leading-tight">{card.value}</p>
            <p className="text-xs db-muted font-sans mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts data={months} />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Upcoming */}
        <div className="lg:col-span-2 db-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-black/[.05] flex items-center justify-between">
            <h2 className="font-serif font-semibold db-text">Sesiuni viitoare</h2>
            <Link href="/admin/calendar" className="text-xs font-sans text-[#ED03E9] hover:underline font-semibold">Calendar →</Link>
          </div>
          {!upcomingBookings?.length
            ? <div className="text-center py-10 db-muted font-sans text-sm">Nicio sesiune programată.</div>
            : <div className="divide-y divide-black/[.04]">
                {upcomingBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-black/[.02] transition-colors">
                    <div className="w-9 h-9 bg-[#ED03E9]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="2" className="w-4 h-4">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold db-text font-sans truncate">
                        {(b.profiles as any)?.full_name || (b.profiles as any)?.email}
                      </p>
                      <p className="text-xs db-muted font-sans capitalize">
                        {format(new Date(b.scheduled_at), "EEEE, d MMM 'la' HH:mm", { locale: ro })}
                      </p>
                    </div>
                    <Badge status={b.status} />
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Quick actions */}
        <div className="space-y-2.5">
          <h2 className="font-serif font-semibold db-text px-1 text-sm">Acțiuni rapide</h2>
          {[
            { href:'/admin/disponibilitate', label:'Adaugă disponibilitate', desc:'Setează slot-uri noi', d:'M12 5v14M5 12h14', c:'#ED03E9', bg:'rgba(237,3,233,0.08)' },
            { href:'/admin/clienti', label:'Gestionează cliente', desc:`${totalClients ?? 0} cliente totale`, d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', c:'#6B00E8', bg:'rgba(107,0,232,0.08)' },
            { href:'/admin/setari', label:'Modifică prețul', desc:`Curent: ${settings?.price_amount ?? 297} ${(settings?.currency??'EUR').toUpperCase()}`, d:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1', c:'#10B981', bg:'rgba(16,185,129,0.08)' },
          ].map(action => (
            <Link key={action.href} href={action.href}
              className="flex items-center gap-3 db-card rounded-xl p-4 hover:shadow-md active:scale-[.99] transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background:action.bg }}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-5 h-5" style={{ stroke:action.c }}>
                  <path d={action.d} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold db-text font-sans">{action.label}</p>
                <p className="text-xs db-muted font-sans truncate">{action.desc}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2" className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
