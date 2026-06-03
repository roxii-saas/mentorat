'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import KPICard from '@/components/charts/KPICard'
import Bars3D from '@/components/charts/Bars3D'
import Area3D from '@/components/charts/Area3D'

interface Booking {
  id: string; scheduled_at: string; status: string
  meet_link: string | null; profiles?: { full_name: string | null; email: string }
}

interface InitialData {
  totalClients: number
  pendingBookings: number
  completedBookings: number
  revenue: number
  currency: string
  salesActive: boolean
  priceAmount: number
  upcomingBookings: Booking[]
  monthlyData: { month: string; bookings: number; clients: number; revenue: number }[]
}

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending:   ['În așteptare', 'g-badge g-badge-pending'],
    confirmed: ['Confirmată',   'g-badge g-badge-confirmed'],
    completed: ['Finalizată',   'g-badge g-badge-completed'],
    cancelled: ['Anulată',      'g-badge g-badge-cancelled'],
  }
  const [l, cls] = m[status] ?? [status, 'bg-gray-100 text-gray-500']
  return <span className={`${cls} text-[11px] font-bold font-sans px-2.5 py-1 rounded-full whitespace-nowrap`}>{l}</span>
}

type Period = '1m' | '3m' | '6m' | '12m'
const PERIOD_LABELS: Record<Period, string> = { '1m': '1 lună', '3m': '3 luni', '6m': '6 luni', '12m': '12 luni' }
const PERIOD_MONTHS: Record<Period, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }

export default function RealtimeDashboard({ initial }: { initial: InitialData }) {
  const [data, setData] = useState(initial)
  const [activity, setActivity] = useState<{ id: string; msg: string; time: Date; type: string }[]>([])
  const [connected, setConnected] = useState(false)
  const [period, setPeriod] = useState<Period>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-period')
      if (saved && ['1m','3m','6m','12m'].includes(saved)) return saved as Period
    }
    return '6m'
  })

  const handlePeriod = (p: Period) => {
    setPeriod(p)
    try { localStorage.setItem('admin-period', p) } catch {}
  }

  const filteredMonthly = data.monthlyData.slice(-PERIOD_MONTHS[period])

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const [
      { count: tc },
      { count: pb },
      { count: cb },
      { data: upcoming },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role','client'),
      supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','completed'),
      supabase.from('bookings').select('*, profiles(full_name, email)').in('status',['pending','confirmed']).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(6),
    ])
    setData(d => ({
      ...d,
      totalClients: tc ?? d.totalClients,
      pendingBookings: pb ?? d.pendingBookings,
      completedBookings: cb ?? d.completedBookings,
      revenue: (cb ?? d.completedBookings) * d.priceAmount,
      upcomingBookings: (upcoming as any) ?? d.upcomingBookings,
    }))
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, payload => {
        refresh()
        setActivity(a => [{
          id: payload.new.id,
          msg: `Rezervare nouă programată pentru ${format(new Date(payload.new.scheduled_at), "d MMM 'la' HH:mm", { locale: ro })}`,
          time: new Date(),
          type: 'booking',
        }, ...a.slice(0, 9)])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, payload => {
        refresh()
        const statusMap: Record<string, string> = { confirmed:'confirmată', completed:'finalizată', cancelled:'anulată' }
        const s = statusMap[payload.new.status]
        if (s) setActivity(a => [{
          id: payload.new.id + Date.now(),
          msg: `Sesiune ${s}`,
          time: new Date(),
          type: payload.new.status,
        }, ...a.slice(0, 9)])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
        refresh()
        setActivity(a => [{
          id: payload.new.id,
          msg: `Clientă nouă înregistrată: ${payload.new.email}`,
          time: new Date(),
          type: 'client',
        }, ...a.slice(0, 9)])
      })
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [refresh])

  const sparkClients = filteredMonthly.map(m => ({ value: m.clients }))
  const sparkBookings = filteredMonthly.map(m => ({ value: m.bookings }))
  const areaData = filteredMonthly.map(m => ({ label: m.month, value: m.revenue }))
  const barsData = filteredMonthly.map(m => ({ label: m.month, value: m.bookings, value2: m.clients }))

  const actIcons: Record<string, string> = {
    booking:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    confirmed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    completed: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    cancelled: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    client:    'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  }
  const actColors: Record<string, string> = {
    booking:'#ED03E9', confirmed:'#10B981', completed:'#6B00E8', cancelled:'#EF4444', client:'#F59E0B',
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Bună ziua, Roxana!</h1>
          <p className="db-muted font-sans text-sm mt-0.5 capitalize">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center g-card rounded-xl p-1 gap-0.5">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button key={p} onClick={() => handlePeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-sans transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white shadow-sm'
                    : 'db-muted hover:bg-black/[.05]'
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-sans transition-colors ${connected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className="relative flex h-1.5 w-1.5">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>}
              <span className={`relative rounded-full h-1.5 w-1.5 inline-flex ${connected ? 'bg-green-500' : 'bg-gray-400'}`}/>
            </span>
            {connected ? 'Realtime activ' : 'Se conectează...'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-sans ${data.salesActive ? 'bg-[#ED03E9]/8 text-[#B800BA]' : 'bg-red-50 text-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${data.salesActive ? 'bg-[#ED03E9] animate-pulse' : 'bg-red-400'}`}/>
            {data.salesActive ? 'Vânzări active' : 'Vânzări oprite'}
          </div>
          <Link href="/admin/setari" className="text-[11px] font-sans font-semibold text-[#3D3D3D] px-3 py-1.5 rounded-full border border-black/10 hover:bg-black/4 transition-colors">
            Setări
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Cliente totale" value={data.totalClients}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          color="#ED03E9" bg="rgba(237,3,233,0.08)" sparkline={sparkClients} live={connected}
          delta="luna aceasta" deltaPositive={true}/>
        <KPICard label="Sesiuni în așteptare" value={data.pendingBookings}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="#F59E0B" bg="rgba(245,158,11,0.08)" sparkline={sparkBookings} live={connected}/>
        <KPICard label="Sesiuni finalizate" value={data.completedBookings}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="#10B981" bg="rgba(16,185,129,0.08)" live={connected}
          delta="față de luna trecută" deltaPositive={data.completedBookings > 0}/>
        <KPICard label="Venit estimat" value={data.revenue}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1"
          color="#6B00E8" bg="rgba(107,0,232,0.08)"
          format={v => `${v.toLocaleString()} ${data.currency.toUpperCase()}`}
          live={connected}/>
      </div>

      {/* Area 3D — Revenue */}
      <div className="g-card rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold db-text">Venit estimat — 6 luni</h3>
            <p className="db-muted text-xs font-sans mt-0.5">Se actualizează în timp real la fiecare plată</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(237,3,233,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-5 h-5">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <Area3D data={areaData} color="#ED03E9" formatValue={v => `${v}€`} height={150}/>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* 3D Bar Chart */}
        <div className="lg:col-span-3 g-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold db-text">Sesiuni & Cliente noi</h3>
              <p className="db-muted text-xs font-sans mt-0.5">Ultimele 6 luni · grafic 3D</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(107,0,232,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B00E8" strokeWidth="1.8" className="w-5 h-5">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <Bars3D data={barsData} label1="Sesiuni" label2="Cliente" height={180}/>
        </div>

        {/* Live Activity */}
        <div className="lg:col-span-2 g-card rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold db-text">Activitate Live</h3>
            {connected && (
              <span className="flex items-center gap-1 text-[10px] font-bold font-sans text-[#10B981]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                  <span className="relative rounded-full h-1.5 w-1.5 bg-green-500 inline-flex"/>
                </span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px]">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <div className="w-10 h-10 bg-[#ED03E9]/8 rounded-xl flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-5 h-5">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-xs db-muted font-sans">Nicio activitate încă</p>
                <p className="text-[11px] db-muted font-sans mt-1 opacity-60">Evenimentele vor apărea aici în timp real</p>
              </div>
            ) : (
              activity.map(item => (
                <div key={item.id} className="flex items-start gap-2.5 animate-fade-up">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: (actColors[item.type] || '#737373') + '15' }}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-3.5 h-3.5" style={{ stroke: actColors[item.type] || '#737373' }}>
                      <path d={actIcons[item.type] || actIcons.booking} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs db-text font-sans leading-tight">{item.msg}</p>
                    <p className="text-[10px] db-muted font-sans mt-0.5">{format(item.time, "HH:mm:ss")}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sesiuni viitoare + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 g-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[.05] flex items-center justify-between">
            <h2 className="font-serif font-semibold db-text">Sesiuni viitoare</h2>
            <Link href="/admin/calendar" className="text-xs font-semibold text-[#ED03E9] hover:underline font-sans">Calendar →</Link>
          </div>
          {!data.upcomingBookings?.length
            ? <div className="py-10 text-center db-muted text-sm font-sans">Nicio sesiune programată.</div>
            : <div className="divide-y divide-black/[.04]">
                {data.upcomingBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3 hover:bg-black/[.02] transition-colors">
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
                    <Badge status={b.status}/>
                  </div>
                ))}
              </div>
          }
        </div>

        <div className="space-y-2.5">
          <p className="font-serif font-semibold db-text text-sm px-1">Acțiuni rapide</p>
          {[
            { href:'/admin/disponibilitate', label:'Adaugă disponibilitate', desc:'Setează slot-uri noi', d:'M12 5v14M5 12h14', c:'#ED03E9', bg:'rgba(237,3,233,0.08)' },
            { href:'/admin/clienti', label:'Gestionează cliente', desc:`${data.totalClients} cliente totale`, d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', c:'#6B00E8', bg:'rgba(107,0,232,0.08)' },
            { href:'/admin/setari', label:'Modifică prețul', desc:`Curent: ${data.priceAmount} ${data.currency.toUpperCase()}`, d:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1', c:'#10B981', bg:'rgba(16,185,129,0.08)' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 g-card rounded-xl p-4 hover:shadow-md active:scale-[.99] transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background:a.bg }}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-5 h-5" style={{ stroke:a.c }}>
                  <path d={a.d} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold db-text font-sans">{a.label}</p>
                <p className="text-xs db-muted font-sans truncate">{a.desc}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
