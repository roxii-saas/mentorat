'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Slot { id: string; date: string; start_time: string; end_time: string }

export default function PrenotaPage() {
  const [slots, setSlots] = useState<Record<string, Slot[]>>({})
  const [selected, setSelected] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { loadSlots() }, [])

  const loadSlots = async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('availability').select('*')
      .eq('is_booked', false).gte('date', today).order('date').order('start_time')
    const grouped: Record<string, Slot[]> = {}
    data?.forEach(s => { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push(s) })
    setSlots(grouped)
    setLoading(false)
  }

  const handleBook = async () => {
    if (!selected) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('bookings').insert({
      client_id: user.id, availability_id: selected.id,
      scheduled_at: new Date(`${selected.date}T${selected.start_time}`).toISOString(),
      client_notes: notes, status: 'pending',
    })
    if (!error) {
      await supabase.from('availability').update({ is_booked: true }).eq('id', selected.id)
      setSuccess(true)
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="w-10 h-10">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Sesiune programată!</h1>
          <p className="text-gray-600 font-sans mb-1">
            <strong>{format(parseISO(selected!.date), "d MMMM yyyy", { locale: ro })}</strong> la {selected!.start_time}
          </p>
          <p className="text-gray-500 font-sans text-sm mb-6">Roxana va confirma și va trimite link-ul de sesiune.</p>
          <a href="/dashboard" className="inline-flex items-center gap-2 bg-[#c97d4e] text-white font-sans font-semibold px-7 py-3 rounded-xl hover:bg-[#a85e35] transition-colors">
            ← Înapoi la dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Programează sesiunea</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Alege un slot disponibil din calendarul Roxanei</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Slots */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="admin-card rounded-2xl p-10 text-center text-gray-400 font-sans border border-gray-100">
              <div className="w-8 h-8 border-3 border-[#c97d4e] border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3 }} />
              Se încarcă disponibilitatea...
            </div>
          ) : Object.keys(slots).length === 0 ? (
            <div className="admin-card rounded-2xl border border-gray-100 p-10 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-14 h-14 mx-auto mb-3">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="font-serif font-semibold text-gray-600 mb-1">Nicio disponibilitate momentan</p>
              <p className="text-gray-400 text-sm font-sans">Verifică din nou în curând sau contactează Roxana.</p>
            </div>
          ) : Object.entries(slots).map(([date, daySlots]) => (
            <div key={date} className="admin-card rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h3 className="font-serif font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="2" className="w-4 h-4">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="capitalize">{format(parseISO(date), "EEEE, d MMMM yyyy", { locale: ro })}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {daySlots.map(slot => (
                  <button key={slot.id} onClick={() => setSelected(selected?.id === slot.id ? null : slot)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-sans font-semibold border-2 transition-all active:scale-95 ${
                      selected?.id === slot.id
                        ? 'border-[#c97d4e] bg-[#c97d4e] text-white shadow-md'
                        : 'border-gray-200 text-gray-700 hover:border-[#c97d4e]/50 hover:bg-orange-50'
                    }`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/>
                    </svg>
                    {slot.start_time} – {slot.end_time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Confirm panel */}
        <div className="lg:col-span-1">
          <div className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 transition-all ${selected ? 'border-[#c97d4e]/30' : 'border-gray-100'} sticky top-20`}>
            <h3 className="font-serif font-semibold text-gray-800 mb-4 text-base sm:text-lg">
              {selected ? 'Confirmă programarea' : 'Selectează un slot'}
            </h3>
            {selected ? (
              <>
                <div className="bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl p-4 text-white mb-4">
                  <p className="font-sans font-bold text-sm">📅 {format(parseISO(selected.date), "d MMMM yyyy", { locale: ro })}</p>
                  <p className="font-sans text-white/80 text-sm mt-0.5">🕐 {selected.start_time} – {selected.end_time}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Note pentru Roxana (opțional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Cu ce anume vrei să te ajute Roxana?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e] resize-none" />
                </div>
                <button onClick={handleBook} disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg active:scale-95">
                  {submitting ? 'Se programează...' : 'Confirmă sesiunea ✓'}
                </button>
                <button onClick={() => setSelected(null)} className="w-full mt-2 py-2 text-gray-500 font-sans text-sm hover:text-gray-700">
                  Anulează
                </button>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-3 opacity-30">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="font-sans text-sm">Selectează un slot din calendar pentru a programa sesiunea ta cu Roxana.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
