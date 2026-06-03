'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import KPICard from '@/components/charts/KPICard'
import LineChart3D from '@/components/charts/LineChart3D'

interface RecentPurchase {
  id: string; name: string; email: string; phone?: string | null
  amount: number; currency: string; created_at: string
}
interface MonthlyData { label: string; year: number; month: number; purchases: number; revenue: number }

interface InitialData {
  totalPurchases: number
  totalRevenue: number
  currency: string
  salesActive: boolean
  priceAmount: number
  monthlyData: MonthlyData[]
  recentPurchases: RecentPurchase[]
}

type Period = '3m' | '6m' | '12m'
const PERIOD_LABELS: Record<Period, string> = { '3m': '3 luni', '6m': '6 luni', '12m': '12 luni' }
const PERIOD_MONTHS: Record<Period, number> = { '3m': 3, '6m': 6, '12m': 12 }

export default function RealtimeDashboard({ initial }: { initial: InitialData }) {
  const [data, setData] = useState(initial)
  const [connected, setConnected] = useState(false)
  const [activity, setActivity] = useState<{ id: string; msg: string; time: Date }[]>([])
  const [period, setPeriod] = useState<Period>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('admin-period')
      if (s && ['3m','6m','12m'].includes(s)) return s as Period
    }
    return '6m'
  })

  const handlePeriod = (p: Period) => {
    setPeriod(p)
    try { localStorage.setItem('admin-period', p) } catch {}
  }

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, name, email, phone, amount, currency, created_at')
      .order('created_at', { ascending: false })

    if (!purchases) return
    const totalPurchases = purchases.length
    const totalRevenue = purchases.reduce((s, p) => s + (p.amount ?? 0), 0)
    const recentPurchases = purchases.slice(0, 6).map(p => ({
      id: p.id,
      name: p.name || p.email?.split('@')[0] || '—',
      email: p.email,
      phone: p.phone,
      amount: p.amount,
      currency: p.currency,
      created_at: p.created_at,
    }))
    setData(d => ({ ...d, totalPurchases, totalRevenue, recentPurchases }))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('admin-purchases')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases' }, payload => {
        refresh()
        setActivity(a => [{
          id: payload.new.id,
          msg: `Rezervare nouă: ${payload.new.name || payload.new.email} — ${payload.new.amount} ${(payload.new.currency ?? 'eur').toUpperCase()}`,
          time: new Date(),
        }, ...a.slice(0, 9)])
      })
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [refresh])

  const filtered = data.monthlyData.slice(-PERIOD_MONTHS[period])
  const revenueData = filtered.map(m => ({ label: m.label, value: m.revenue }))
  const purchasesData = filtered.map(m => ({ label: m.label, value: m.purchases }))

  const sparkRevenue = filtered.map(m => ({ value: m.revenue }))
  const sparkPurchases = filtered.map(m => ({ value: m.purchases }))

  const thisMonth = data.monthlyData[data.monthlyData.length - 1]
  const prevMonth = data.monthlyData[data.monthlyData.length - 2]

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
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
                  period === p ? 'bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white shadow-sm' : 'db-muted hover:bg-black/[.05]'
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-sans ${connected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className="relative flex h-1.5 w-1.5">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>}
              <span className={`relative rounded-full h-1.5 w-1.5 inline-flex ${connected ? 'bg-green-500' : 'bg-gray-400'}`}/>
            </span>
            {connected ? 'Live' : 'Offline'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-sans ${data.salesActive ? 'bg-[#ED03E9]/8 text-[#B800BA]' : 'bg-red-50 text-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${data.salesActive ? 'bg-[#ED03E9] animate-pulse' : 'bg-red-400'}`}/>
            {data.salesActive ? 'Vânzări active' : 'Vânzări oprite'}
          </div>
          <Link href="/admin/setari" className="text-[11px] font-sans font-semibold db-muted px-3 py-1.5 rounded-full border border-black/10 hover:bg-black/4 transition-colors">
            Setări
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Rezervări totale" value={data.totalPurchases}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          color="#ED03E9" bg="rgba(237,3,233,0.08)" sparkline={sparkPurchases} live={connected}/>
        <KPICard label="Venit total" value={data.totalRevenue}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1"
          color="#6B00E8" bg="rgba(107,0,232,0.08)" sparkline={sparkRevenue} live={connected}
          format={v => `${v.toLocaleString('ro-RO')} ${data.currency.toUpperCase()}`}/>
        <KPICard label="Luna aceasta" value={thisMonth?.purchases ?? 0}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="#10B981" bg="rgba(16,185,129,0.08)" live={connected}
          delta={prevMonth ? `${prevMonth.purchases > 0 ? '+' : ''}${thisMonth.purchases - prevMonth.purchases} față de luna trecută` : undefined}
          deltaPositive={(thisMonth?.purchases ?? 0) >= (prevMonth?.purchases ?? 0)}/>
        <KPICard label="Venit luna aceasta" value={thisMonth?.revenue ?? 0}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          color="#F59E0B" bg="rgba(245,158,11,0.08)" live={connected}
          format={v => `${v.toLocaleString('ro-RO')} ${data.currency.toUpperCase()}`}/>
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Revenue chart */}
        <div className="g-card rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif font-bold db-text">Venit — {PERIOD_LABELS[period]}</h3>
              <p className="db-muted text-xs font-sans mt-0.5">Rezervări confirmate prin Stripe</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(237,3,233,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-5 h-5">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <LineChart3D
            data={revenueData}
            color="#ED03E9"
            formatValue={v => `${v}€`}
            height={180}
          />
        </div>

        {/* Purchases chart */}
        <div className="g-card rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif font-bold db-text">Rezervări — {PERIOD_LABELS[period]}</h3>
              <p className="db-muted text-xs font-sans mt-0.5">Număr de clienți care au rezervat</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(107,0,232,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B00E8" strokeWidth="1.8" className="w-5 h-5">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <LineChart3D
            data={purchasesData}
            color="#6B00E8"
            formatValue={v => `${v}`}
            height={180}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Rezervări recente */}
        <div className="lg:col-span-2 g-card rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[.05] flex items-center justify-between">
            <h2 className="font-serif font-semibold db-text">Rezervări recente</h2>
            <Link href="/admin/clienti" className="text-xs font-semibold text-[#ED03E9] hover:underline font-sans">
              Toate →
            </Link>
          </div>
          {!data.recentPurchases?.length ? (
            <div className="py-10 text-center db-muted text-sm font-sans">Nicio rezervare încă.</div>
          ) : (
            <div className="divide-y divide-black/[.04]">
              {data.recentPurchases.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-black/[.02] transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#ED03E9] to-[#B800BA] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                    {(p.name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold db-text font-sans truncate">{p.name}</p>
                    <p className="text-xs db-muted font-sans truncate">{p.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold db-text font-sans">{p.amount} {p.currency.toUpperCase()}</p>
                    <p className="text-xs db-muted font-sans">
                      {format(new Date(p.created_at), "d MMM", { locale: ro })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + Live activity */}
        <div className="space-y-3">
          {/* Activity */}
          <div className="g-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold db-text text-sm">Activitate Live</h3>
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
            {activity.length === 0 ? (
              <p className="text-xs db-muted font-sans py-4 text-center">Nicio activitate recenta</p>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {activity.map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ED03E9] mt-1.5 flex-shrink-0"/>
                    <div>
                      <p className="text-xs db-text font-sans leading-tight">{item.msg}</p>
                      <p className="text-[10px] db-muted font-sans mt-0.5">{format(item.time, "HH:mm:ss")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {[
              { href:'/admin/clienti', label:'Gestionează clienți', desc:`${data.totalPurchases} rezervări totale`, d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', c:'#6B00E8', bg:'rgba(107,0,232,0.08)' },
              { href:'/admin/setari', label:'Modifică prețul', desc:`Curent: ${data.priceAmount} ${data.currency.toUpperCase()}`, d:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1', c:'#10B981', bg:'rgba(16,185,129,0.08)' },
              { href:'/admin/homepage', label:'Editează Home page', desc:'Imagini, prețuri, CTA', d:'M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9', c:'#ED03E9', bg:'rgba(237,3,233,0.08)' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="flex items-center gap-3 g-card rounded-xl p-3.5 hover:shadow-md active:scale-[.99] transition-all group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:a.bg }}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-4 h-4" style={{ stroke:a.c }}>
                    <path d={a.d} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold db-text font-sans">{a.label}</p>
                  <p className="text-xs db-muted font-sans truncate">{a.desc}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
