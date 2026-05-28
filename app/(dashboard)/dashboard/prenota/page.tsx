'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Calendar, Clock, CheckCircle } from 'lucide-react'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
}

export default function PrenotaPage() {
  const [slots, setSlots] = useState<Record<string, Slot[]>>({})
  const [selected, setSelected] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSlots()
  }, [])

  const loadSlots = async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('is_booked', false)
      .gte('date', today)
      .order('date')
      .order('start_time')

    // Raggruppa per data
    const grouped: Record<string, Slot[]> = {}
    data?.forEach(slot => {
      if (!grouped[slot.date]) grouped[slot.date] = []
      grouped[slot.date].push(slot)
    })
    setSlots(grouped)
    setLoading(false)
  }

  const handleBook = async () => {
    if (!selected) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const scheduledAt = new Date(`${selected.date}T${selected.start_time}`)

    const { error } = await supabase.from('bookings').insert({
      client_id: user.id,
      availability_id: selected.id,
      scheduled_at: scheduledAt.toISOString(),
      client_notes: notes,
      status: 'pending',
    })

    if (!error) {
      // Marchează slot ca ocupat
      await supabase.from('availability').update({ is_booked: true }).eq('id', selected.id)
      setSuccess(true)
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-serif mb-2">Sesiune programată!</h1>
        <p className="text-gray-600 font-sans mb-2">
          Sesiunea ta a fost programată pentru{' '}
          <strong>{format(parseISO(selected!.date), "d MMMM yyyy", { locale: ro })}</strong>{' '}
          la ora <strong>{selected!.start_time}</strong>.
        </p>
        <p className="text-gray-500 text-sm font-sans">
          Roxana îți va confirma sesiunea și va trimite link-ul de conectare.
        </p>
        <a href="/dashboard" className="inline-block mt-6 bg-[#c97d4e] text-white font-sans font-semibold px-8 py-3 rounded-xl hover:bg-[#a85e35] transition-colors">
          Înapoi la dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Programează sesiunea ta</h1>
        <p className="text-gray-500 font-sans mt-1">Alege un slot disponibil din calendarul Roxanei</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-sans">Se încarcă disponibilitatea...</div>
      ) : Object.keys(slots).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 font-serif">Nu există slot-uri disponibile momentan</p>
          <p className="text-gray-400 text-sm font-sans mt-1">Verifică din nou în curând sau contactează Roxana.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(slots).map(([date, daySlots]) => (
            <div key={date} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 font-serif mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#c97d4e]" />
                {format(parseISO(date), "EEEE, d MMMM yyyy", { locale: ro })}
              </h3>
              <div className="flex flex-wrap gap-2">
                {daySlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelected(selected?.id === slot.id ? null : slot)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-sans font-semibold border-2 transition-all ${
                      selected?.id === slot.id
                        ? 'border-[#c97d4e] bg-[#c97d4e] text-white'
                        : 'border-gray-200 text-gray-700 hover:border-[#c97d4e]/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {slot.start_time} – {slot.end_time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="bg-[#c97d4e]/10 rounded-xl p-4">
            <p className="font-semibold text-gray-800 font-sans">
              📅 {format(parseISO(selected.date), "EEEE, d MMMM yyyy", { locale: ro })} · {selected.start_time} – {selected.end_time}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">
              Note pentru Roxana (opțional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Spune-i Roxanei cu ce anume vrei să te ajute în această sesiune..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e] resize-none"
            />
          </div>
          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {submitting ? 'Se programează...' : 'Confirmă programarea'}
          </button>
        </div>
      )}
    </div>
  )
}
