'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from 'date-fns'
import { ro } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Link2, CheckCircle, X } from 'lucide-react'

interface Booking {
  id: string
  scheduled_at: string
  status: string
  meet_link: string | null
  client_notes: string | null
  admin_notes: string | null
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
    const start = startOfMonth(currentMonth).toISOString()
    const end = endOfMonth(currentMonth).toISOString()
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name, email)')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .neq('status', 'cancelled')
      .order('scheduled_at')
    setBookings((data as any) ?? [])
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7 // 0=lun

  const openBooking = (booking: Booking) => {
    setSelected(booking)
    setMeetLink(booking.meet_link || '')
    setAdminNotes(booking.admin_notes || '')
  }

  const saveBooking = async () => {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('bookings').update({
      meet_link: meetLink || null,
      admin_notes: adminNotes || null,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif">Calendar sesiuni</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold font-sans text-gray-800 min-w-[140px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ro })}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Intestazione giorni */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 font-sans">{d}</div>
          ))}
        </div>

        {/* Griglia calendario */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />
          ))}
          {days.map(day => {
            const dayBookings = bookings.filter(b => isSameDay(parseISO(b.scheduled_at), day))
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 ${isToday(day) ? 'bg-[#c97d4e]/5' : ''}`}
              >
                <p className={`text-xs font-sans font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-[#c97d4e] text-white' : 'text-gray-500'
                }`}>
                  {format(day, 'd')}
                </p>
                {dayBookings.map(b => (
                  <button
                    key={b.id}
                    onClick={() => openBooking(b)}
                    className={`w-full text-left text-xs px-1.5 py-1 rounded-md mb-0.5 font-sans truncate ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      b.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {format(parseISO(b.scheduled_at), 'HH:mm')} {b.profiles?.full_name?.split(' ')[0] || b.profiles?.email}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal dettagli prenotazione */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg font-serif">Detalii sesiune</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-semibold text-gray-800 font-sans">{selected.profiles?.full_name || selected.profiles?.email}</p>
                <p className="text-sm text-gray-500 font-sans">{selected.profiles?.email}</p>
              </div>
              <p className="text-sm font-sans text-gray-700">
                📅 <strong>{format(parseISO(selected.scheduled_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}</strong>
              </p>
              {selected.client_notes && (
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-1 font-sans">Note clientă:</p>
                  <p className="text-sm text-yellow-700 font-sans">{selected.client_notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Link sesiune (Google Meet / Zoom)
                </label>
                <input type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Note admin</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e] resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={saveBooking} disabled={saving}
                className="flex-1 bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {saving ? 'Se salvează...' : 'Confirmă & Salvează'}
              </button>
              {selected.status !== 'completed' && (
                <button onClick={() => updateStatus(selected.id, 'completed')}
                  className="px-4 bg-blue-100 text-blue-700 font-sans font-semibold py-2.5 rounded-xl hover:bg-blue-200 transition-colors text-sm">
                  Finalizată
                </button>
              )}
              <button onClick={() => updateStatus(selected.id, 'cancelled')}
                className="px-4 bg-red-50 text-red-600 font-sans font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
