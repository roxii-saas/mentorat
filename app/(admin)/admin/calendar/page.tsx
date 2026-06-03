'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Booking {
  id: string; scheduled_at: string; status: string
  meet_link: string | null; client_notes: string | null; admin_notes: string | null
  profiles: { full_name: string | null; email: string }
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)
  const [meetLink, setMeetLink] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadBookings() }, [currentMonth])

  const loadBookings = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('bookings')
      .select('*, profiles(full_name, email)')
      .gte('scheduled_at', startOfMonth(currentMonth).toISOString())
      .lte('scheduled_at', endOfMonth(currentMonth).toISOString())
      .neq('status', 'cancelled').order('scheduled_at')
    setBookings((data as any) ?? [])
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDow = (startOfMonth(currentMonth).getDay() + 6) % 7

  const openBooking = (b: Booking) => { setSelected(b); setMeetLink(b.meet_link || ''); setAdminNotes(b.admin_notes || '') }

  const saveBooking = async () => {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('bookings').update({
      meet_link: meetLink || null, admin_notes: adminNotes || null,
      status: selected.status === 'pending' ? 'confirmed' : selected.status,
    }).eq('id', selected.id)
    await loadBookings()
    setSaving(false)
    setSelected(null)
  }

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('bookings').update({ status }).eq('id', id)
    await loadBookings()
    if (selected?.id === id) setSelected(null)
  }

  const statusCls: Record<string, string> = {
    pending:   'bg-amber-500/15 text-amber-600 border-amber-400/30',
    confirmed: 'bg-green-500/15 text-green-700 border-green-400/30',
    completed: 'bg-[#6B00E8]/15 text-[#6B00E8] border-[#6B00E8]/30',
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold db-text">Calendar sesiuni</h1>
          <p className="db-muted font-sans text-sm mt-0.5">{bookings.length} sesiuni această lună</p>
        </div>
        <div className="flex items-center gap-2 g-card rounded-xl p-1">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-black/[.06] transition-colors db-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="font-sans font-semibold db-text text-sm min-w-[130px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ro })}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-black/[.06] transition-colors db-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="g-card rounded-2xl overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-black/[.05]">
          {['Lun','Mar','Mie','Joi','Vin','Sâm','Dum'].map(d => (
            <div key={d} className="py-3 text-center text-[11px] font-bold db-muted font-sans uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[64px] sm:min-h-[80px] border-b border-r border-black/[.04]" />
          ))}
          {days.map(day => {
            const dayB = bookings.filter(b => isSameDay(parseISO(b.scheduled_at), day))
            return (
              <div key={day.toISOString()}
                className={`min-h-[64px] sm:min-h-[80px] border-b border-r border-black/[.04] p-1 sm:p-1.5 transition-colors ${isToday(day) ? 'bg-[#ED03E9]/5' : 'hover:bg-black/[.01]'}`}>
                <p className={`text-xs font-sans font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-[#ED03E9] text-white shadow-md' : 'db-muted'
                }`}>{format(day, 'd')}</p>
                <div className="space-y-0.5">
                  {dayB.map(b => (
                    <button key={b.id} onClick={() => openBooking(b)}
                      className={`w-full text-left text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-lg font-sans truncate border ${statusCls[b.status] ?? 'bg-black/5 db-muted border-black/10'} hover:opacity-75 transition-opacity`}>
                      <span className="hidden sm:inline">{format(parseISO(b.scheduled_at), 'HH:mm')} </span>
                      {b.profiles?.full_name?.split(' ')[0] || b.profiles?.email?.split('@')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 flex-wrap px-1">
        {[
          { label: 'În așteptare', cls: 'bg-amber-500/15 border-amber-400/30 text-amber-600' },
          { label: 'Confirmată',   cls: 'bg-green-500/15 border-green-400/30 text-green-700' },
          { label: 'Finalizată',   cls: 'bg-[#6B00E8]/15 border-[#6B00E8]/30 text-[#6B00E8]' },
        ].map(l => (
          <span key={l.label} className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full border ${l.cls}`}>{l.label}</span>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelected(null)}>
          <div className="g-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl border border-black/[.08]"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif font-bold db-text text-lg">Detalii sesiune</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/[.06] db-muted transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="bg-[#ED03E9]/6 border border-[#ED03E9]/15 rounded-xl p-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ED03E9] to-[#B800BA] rounded-full flex items-center justify-center text-white font-bold font-sans text-sm flex-shrink-0 shadow-md">
                  {(selected.profiles?.full_name || selected.profiles?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold db-text font-sans text-sm">{selected.profiles?.full_name || selected.profiles?.email}</p>
                  <p className="db-muted text-xs font-sans">{selected.profiles?.email}</p>
                </div>
              </div>
              <p className="text-[#ED03E9] text-xs font-sans mt-2.5 font-semibold flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {format(parseISO(selected.scheduled_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
              </p>
            </div>

            {selected.client_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-amber-700 font-sans mb-1">Note clientă:</p>
                <p className="text-sm text-amber-800 font-sans">{selected.client_notes}</p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold db-muted mb-1.5 font-sans">Link sesiune (Meet/Zoom)</label>
                <input type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-black/[.03] border border-black/[.08] db-text rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/30 focus:border-[#ED03E9]/50 placeholder:text-[#ABABAB]" />
              </div>
              <div>
                <label className="block text-xs font-semibold db-muted mb-1.5 font-sans">Note admin</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                  className="w-full bg-black/[.03] border border-black/[.08] db-text rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/30 focus:border-[#ED03E9]/50 resize-none placeholder:text-[#ABABAB]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={saveBooking} disabled={saving}
                className="col-span-2 bg-gradient-to-r from-[#ED03E9] to-[#B800BA] text-white font-sans font-semibold py-3 rounded-xl transition-all disabled:opacity-60 active:scale-[.98] shadow-md shadow-[#ED03E9]/20">
                {saving ? 'Se salvează...' : '✓ Confirmă & Salvează'}
              </button>
              {selected.status !== 'completed' && (
                <button onClick={() => updateStatus(selected.id, 'completed')}
                  className="bg-[#6B00E8]/10 text-[#6B00E8] font-sans font-semibold py-2.5 rounded-xl hover:bg-[#6B00E8]/20 transition-colors text-sm border border-[#6B00E8]/20">
                  Finalizată
                </button>
              )}
              <button onClick={() => updateStatus(selected.id, 'cancelled')}
                className={`bg-red-50 text-red-600 font-sans font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm border border-red-200 ${selected.status === 'completed' ? 'col-span-2' : ''}`}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
