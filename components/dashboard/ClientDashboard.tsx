'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns'
import { ro } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import KPICard from '@/components/charts/KPICard'
import BarChart from '@/components/admin/BarChart'

interface Booking {
  id: string; scheduled_at: string; status: string
  duration_minutes: number | null; meet_link: string | null; client_notes: string | null
}
interface Profile { full_name: string | null; purchased_at: string | null; email: string }

interface InitialData {
  profile: Profile
  bookings: Booking[]
}

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending:   ['În așteptare', 'g-badge g-badge-pending'],
    confirmed: ['Confirmată',   'g-badge g-badge-confirmed'],
    completed: ['Finalizată',   'g-badge g-badge-completed'],
    cancelled: ['Anulată',      'g-badge g-badge-cancelled'],
  }
  const [l, cls] = m[status] ?? [status, 'bg-gray-100 text-gray-500']
  return <span className={`${cls} text-xs font-bold font-sans px-2.5 py-1 rounded-full whitespace-nowrap`}>{l}</span>
}

function Countdown({ target }: { target: Date }) {
  const calc = () => {
    const now = new Date()
    if (target <= now) return null
    const days = differenceInDays(target, now)
    const hours = differenceInHours(target, now) % 24
    const mins = differenceInMinutes(target, now) % 60
    const secs = differenceInSeconds(target, now) % 60
    return { days, hours, mins, secs }
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(t)
  }, [target])
  if (!left) return <span className="text-[#10B981] font-bold font-sans text-sm">Acum!</span>
  if (left.days > 2) return <span className="db-muted font-sans text-sm">în {left.days} zile</span>
  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {[
        [left.days, 'zile'],
        [left.hours, 'ore'],
        [left.mins, 'min'],
        [left.secs, 'sec'],
      ].filter(([v]) => (v as number) > 0 || left.days === 0).map(([v, l]) => (
        <div key={String(l)} className="flex flex-col items-center bg-white/10 rounded-[10px] px-3 py-1.5 min-w-[52px]">
          <span className="text-white font-bold text-xl leading-6 tnum">{String(v).padStart(2,'0')}</span>
          <span className="text-[#C9C9D6] text-xs font-medium uppercase tracking-wider">{l}</span>
        </div>
      ))}
    </div>
  )
}

export default function ClientDashboard({ initial }: { initial: InitialData }) {
  const [bookings, setBookings] = useState(initial.bookings)
  const [profile] = useState(initial.profile)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('bookings').select('*').eq('client_id', user.id).order('scheduled_at', { ascending: false })
    if (data) setBookings(data as Booking[])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      supabase.channel(`bookings:${user.id}`)
        .on('postgres_changes', { event:'*', schema:'public', table:'bookings', filter:`client_id=eq.${user.id}` }, refresh)
        .subscribe()
    }
    init()
  }, [refresh])

  const upcoming = bookings
    .filter(b => b.status !== 'cancelled' && new Date(b.scheduled_at) > new Date())
    .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))
  const completed = bookings.filter(b => b.status === 'completed')
  const nextBooking = upcoming[0]
  const days = profile.purchased_at ? differenceInDays(new Date(), new Date(profile.purchased_at)) : 0
  const firstName = profile.full_name?.split(' ')[0] || 'prietenă'
  const progress = Math.min(100, Math.round((completed.length / Math.max(bookings.length, 1)) * 100))
  const circ = 2 * Math.PI * 50

  // Mini area chart per progresso mensile (ultimi 4 mesi)
  const monthlyProgress = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (3 - i))
    const cnt = completed.filter(b => {
      const bd = new Date(b.scheduled_at)
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
    }).length
    return { label: format(d, 'MMM', { locale: ro }), value: cnt }
  })

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold db-text">Bună, {firstName}!</h1>
          <p className="db-muted text-sm font-sans mt-0.5">
            {days > 0 ? `Membră de ${days} zile · progres: ${progress}%` : 'Bine ai venit în platformă!'}
          </p>
        </div>
        <Link href="/dashboard/prenota" className="g-btn g-btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Programează sesiune
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Sesiuni totale" value={bookings.length}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="#ED03E9" bg="rgba(237,3,233,0.08)"/>
        <KPICard label="Finalizate" value={completed.length}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="#10B981" bg="rgba(16,185,129,0.08)"
          delta={completed.length > 0 ? `+${completed.length} total` : undefined} deltaPositive={true}/>
        <KPICard label="Viitoare" value={upcoming.length}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="#6B00E8" bg="rgba(107,0,232,0.08)"/>
        <KPICard label="Zile membră" value={days}
          icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          color="#F59E0B" bg="rgba(245,158,11,0.08)"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Prossima sessione */}
        <div className="lg:col-span-2">
          {nextBooking ? (
            <div className="rounded-[14px] bg-[#15151C] shadow-[0_1px_2px_rgba(16,16,32,.12)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#E9A8EC]"/>
                  <span className="text-[#C9C9D6] text-xs font-bold uppercase tracking-widest">Următoarea sesiune</span>
                </div>
                <p className="text-white font-bold text-xl sm:text-2xl capitalize">
                  {format(new Date(nextBooking.scheduled_at), "EEEE, d MMMM", { locale: ro })}
                </p>
                <p className="text-[#C9C9D6] text-[15px] leading-6 mt-0.5 mb-3">
                  {format(new Date(nextBooking.scheduled_at), "HH:mm")} · {nextBooking.duration_minutes ?? 60} min
                </p>
                <Countdown target={new Date(nextBooking.scheduled_at)}/>
                {nextBooking.meet_link && (
                  <a href={nextBooking.meet_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-[#8A008D] font-semibold text-[15px] px-5 min-h-11 rounded-[10px] hover:bg-[#F6F6FA] transition-colors mt-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Intră în sesiune
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="g-card !border-dashed !border-[#B9B9C9] p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[180px]">
              <div className="w-12 h-12 bg-[#FBEBFB] rounded-xl flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B800BA" strokeWidth="1.8" className="w-6 h-6">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-bold db-text mb-1">Nicio sesiune programată</p>
              <p className="db-muted text-sm font-sans mb-4">Rezervă primul tău slot cu Roxana!</p>
              <Link href="/dashboard/prenota" className="inline-flex items-center gap-2 bg-[#B800BA] text-white font-sans font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#96009A] active:scale-[.98] transition-all shadow-md">
                Programează acum
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          )}
        </div>

        {/* Progress SVG */}
        <div className="g-card p-5 flex flex-col">
          <h3 className="text-base font-semibold db-text mb-3">Progresul tău</h3>
          <div className="flex items-center justify-center flex-1 my-1">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#EEEEF4" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" strokeLinecap="round"
                  stroke="#B800BA" strokeDasharray={`${(progress/100)*circ} ${circ}`}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold db-text">{progress}%</span>
                <span className="text-[13px] db-muted">completat</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[13px] leading-5 font-semibold db-muted mb-2">Sesiuni finalizate pe lună</p>
            <BarChart color="#B800BA" height={72} ariaLabel="Sesiuni finalizate în ultimele 4 luni"
              bars={monthlyProgress.map(m => ({ value: m.value, label: m.label, tip: `${m.label}: ${m.value}`, showLabel: true }))}/>
          </div>
        </div>
      </div>

      {/* Storico */}
      {bookings.length > 0 && (
        <div className="g-card overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-black/[.05] flex items-center justify-between">
            <h2 className="text-lg font-semibold db-title">Istoricul sesiunilor</h2>
            <span className="text-sm db-muted">{bookings.length} total</span>
          </div>
          <div className="divide-y divide-black/[.04]">
            {bookings.slice(0, 6).map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-[#FAFAFD] transition-colors">
                <div className="w-9 h-9 bg-[#FBEBFB] rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8A008D" strokeWidth="2" className="w-[18px] h-[18px]">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] leading-[22px] font-semibold db-text">{format(new Date(b.scheduled_at), "d MMM yyyy", { locale: ro })}</p>
                  <p className="text-[13px] leading-[18px] db-muted">{format(new Date(b.scheduled_at), "HH:mm")} · {b.duration_minutes ?? 60} min</p>
                </div>
                {b.meet_link && b.status === 'confirmed' && (
                  <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#8A008D] hover:underline hidden sm:block font-sans">Intră →</a>
                )}
                <Badge status={b.status}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
