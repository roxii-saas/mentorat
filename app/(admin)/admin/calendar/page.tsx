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

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">Calendar sesiuni</h1>
          <p className="text-gray-400 font-sans text-sm mt-0.5">{bookings.length} sesiuni această lună</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-1 border border-white/5">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="font-sans font-semibold text-white text-sm min-w-[120px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ro })}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {['Lun','Mar','Mie','Joi','Vin','Sâm','Dum'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 font-sans">{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[64px] sm:min-h-[80px] border-b border-r border-white/5" />
          ))}
          {days.map(day => {
            const dayB = bookings.filter(b => isSameDay(parseISO(b.scheduled_at), day))
            return (
              <div key={day.toISOString()}
                className={`min-h-[64px] sm:min-h-[80px] border-b border-r border-white/5 p-1 sm:p-1.5 ${isToday(day) ? 'bg-[#ED03E9]/5' : ''}`}>
                <p className={`text-xs font-sans font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-[#ED03E9] text-white' : 'text-gray-500'
                }`}>{format(day, 'd')}</p>
                <div className="space-y-0.5">
                  {dayB.map(b => (
                    <button key={b.id} onClick={() => openBooking(b)}
                      className={`w-full text-left text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 sm:py-1 rounded font-sans truncate border ${statusColor[b.status] ?? 'bg-gray-700 text-gray-400 border-gray-600'} hover:opacity-80 transition-opacity`}>
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

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-white text-lg">Detalii sesiune</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-3.5 mb-4">
              <p className="font-semibold text-white font-sans text-sm">{selected.profiles?.full_name || selected.profiles?.email}</p>
              <p className="text-gray-400 text-xs font-sans mt-0.5">{selected.profiles?.email}</p>
              <p className="text-[#ED03E9] text-xs font-sans mt-1 font-semibold">
                {format(parseISO(selected.scheduled_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
              </p>
            </div>

            {selected.client_notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-amber-400 font-sans mb-1">Note clientă:</p>
                <p className="text-sm text-amber-200 font-sans">{selected.client_notes}</p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 font-sans">Link sesiune (Meet/Zoom)</label>
                <input type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/40 focus:border-[#ED03E9]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 font-sans">Note admin</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                  className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/40 focus:border-[#ED03E9] resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={saveBooking} disabled={saving}
                className="col-span-2 bg-gradient-to-r from-[#ED03E9] to-[#B800BA] text-white font-sans font-semibold py-3 rounded-xl transition-all disabled:opacity-60 active:scale-95 shadow-md">
                {saving ? 'Se salvează...' : '✓ Confirmă & Salvează'}
              </button>
              {selected.status !== 'completed' && (
                <button onClick={() => updateStatus(selected.id, 'completed')}
                  className="bg-blue-500/20 text-blue-300 font-sans font-semibold py-2.5 rounded-xl hover:bg-blue-500/30 transition-colors text-sm">
                  Finalizată
                </button>
              )}
              <button onClick={() => updateStatus(selected.id, 'cancelled')}
                className={`bg-red-500/20 text-red-400 font-sans font-semibold py-2.5 rounded-xl hover:bg-red-500/30 transition-colors text-sm ${selected.status === 'completed' ? 'col-span-2' : ''}`}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
