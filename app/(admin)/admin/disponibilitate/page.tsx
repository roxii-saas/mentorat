'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, addDays } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Plus, Trash2, Copy } from 'lucide-react'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
]

export default function DisponibilitatePage() {
  const [slots, setSlots] = useState<Record<string, Slot[]>>({})
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [adding, setAdding] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkDays, setBulkDays] = useState<string[]>([])

  useEffect(() => { loadSlots() }, [])

  const loadSlots = async () => {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('availability')
      .select('*')
      .gte('date', today)
      .order('date')
      .order('start_time')

    const grouped: Record<string, Slot[]> = {}
    data?.forEach(slot => {
      if (!grouped[slot.date]) grouped[slot.date] = []
      grouped[slot.date].push(slot)
    })
    setSlots(grouped)
    setLoading(false)
  }

  const addSlot = async () => {
    if (!date || !startTime || !endTime) return
    setAdding(true)
    const supabase = createClient()

    const datesToAdd = bulkMode && bulkDays.length > 0
      ? bulkDays
      : [date]

    for (const d of datesToAdd) {
      await supabase.from('availability').upsert({
        date: d, start_time: startTime, end_time: endTime, is_booked: false
      }, { onConflict: 'date,start_time', ignoreDuplicates: true })
    }

    await loadSlots()
    setAdding(false)
    if (!bulkMode) setDate('')
  }

  const deleteSlot = async (id: string) => {
    const supabase = createClient()
    await supabase.from('availability').delete().eq('id', id)
    await loadSlots()
  }

  // Genera i prossimi 7 giorni per bulk
  const next7Days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i + 1)
    return d.toISOString().split('T')[0]
  })

  const toggleBulkDay = (day: string) => {
    setBulkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Disponibilitate</h1>
        <p className="text-gray-500 font-sans mt-1">Setează slot-urile în care clientele pot programa sesiuni</p>
      </div>

      {/* Aggiungi slot */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-serif">Adaugă slot nou</h2>
          <button
            onClick={() => { setBulkMode(!bulkMode); setBulkDays([]) }}
            className="text-sm font-sans text-[#c97d4e] hover:underline flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            {bulkMode ? 'Mod simplu' : 'Adaugă pe mai multe zile'}
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {!bulkMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Ora de start</label>
            <select value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]">
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Ora de final</label>
            <select value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]">
              {TIME_SLOTS.filter(t => t > startTime).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {bulkMode && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2 font-sans">Selectează zilele:</p>
            <div className="flex flex-wrap gap-2">
              {next7Days.map(day => (
                <button key={day}
                  onClick={() => toggleBulkDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-semibold border-2 transition-all ${
                    bulkDays.includes(day)
                      ? 'border-[#c97d4e] bg-[#c97d4e] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-[#c97d4e]/40'
                  }`}>
                  {format(parseISO(day), 'EEE d MMM', { locale: ro })}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={addSlot}
          disabled={adding || (!bulkMode && !date) || (bulkMode && bulkDays.length === 0)}
          className="flex items-center gap-2 bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {adding ? 'Se adaugă...' : `Adaugă ${bulkMode ? bulkDays.length : 1} slot${bulkDays.length > 1 ? '-uri' : ''}`}
        </button>
      </div>

      {/* Slot esistenti */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 font-sans py-8">Se încarcă...</p>
        ) : Object.keys(slots).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 font-sans">Nu ai slot-uri disponibile. Adaugă unul mai sus.</p>
          </div>
        ) : (
          Object.entries(slots).map(([date, daySlots]) => (
            <div key={date} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold font-serif text-gray-900 mb-3 capitalize">
                {format(parseISO(date), "EEEE, d MMMM yyyy", { locale: ro })}
              </h3>
              <div className="flex flex-wrap gap-2">
                {daySlots.map(slot => (
                  <div key={slot.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-sans border ${
                    slot.is_booked
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-700'
                  }`}>
                    <span>{slot.start_time} – {slot.end_time}</span>
                    {slot.is_booked && <span className="text-xs text-green-600 font-semibold">✓ Rezervat</span>}
                    {!slot.is_booked && (
                      <button onClick={() => deleteSlot(slot.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
